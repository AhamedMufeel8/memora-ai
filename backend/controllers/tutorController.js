const ChatSession = require('../models/ChatSession');
const { generateTutorResponse, generateSessionTitle } = require('../services/tutorService');

/**
 * Helper to ensure a session belongs to the requesting user
 */
const verifySessionOwnership = async (sessionId, userId) => {
  const session = await ChatSession.findById(sessionId);
  if (!session) {
    const error = new Error('Chat session not found');
    error.statusCode = 404;
    throw error;
  }
  if (session.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access this session');
    error.statusCode = 403;
    throw error;
  }
  return session;
};

/**
 * Creates a new, blank chat session for the authenticated user
 */
exports.createSession = async (req, res) => {
  try {
    const { studentLevel, title } = req.body;
    
    const newSession = new ChatSession({
      userId: req.user._id,
      title: title || 'New Chat Session',
      studentLevel: studentLevel || 'beginner',
      messages: []
    });

    const savedSession = await newSession.save();
    
    res.status(201).json({
      success: true,
      message: 'New chat session created successfully',
      data: savedSession
    });
  } catch (error) {
    console.error('[Tutor Controller] Create session error:', error);
    res.status(500).json({ success: false, message: 'Server error creating chat session' });
  }
};

/**
 * Retrieves a list of all chat sessions for the authenticated user
 */
exports.listSessions = async (req, res) => {
  try {
    // Return sessions ordered by most recently updated
    const sessions = await ChatSession.find({ userId: req.user._id })
      .select('title studentLevel createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('[Tutor Controller] List sessions error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat sessions' });
  }
};

/**
 * Fetches the full message history of a single session
 */
exports.getSession = async (req, res) => {
  try {
    const session = await verifySessionOwnership(req.params.id, req.user._id);
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('[Tutor Controller] Get session error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error fetching chat session details'
    });
  }
};

/**
 * Sends a new message to a session, invokes Gemini AI, and appends the response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, studentLevel, contextDocs } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const session = await verifySessionOwnership(req.params.id, req.user._id);

    // Save user's message
    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    
    session.messages.push(userMessage);

    // Update level if explicitly passed
    if (studentLevel) {
      session.studentLevel = studentLevel;
    }

    // Capture history (excluding the new user message we just pushed)
    const history = session.messages.slice(0, -1);

    // Generate educational tutor response via Gemini AI
    const aiContent = await generateTutorResponse(
      history,
      userMessage.content,
      session.studentLevel,
      contextDocs || ''
    );

    // Save assistant's message
    const aiMessage = {
      role: 'assistant',
      content: aiContent,
      timestamp: new Date()
    };

    session.messages.push(aiMessage);

    // Auto-generate a descriptive session title on the very first message
    if (session.title === 'New Chat Session' && history.length === 0) {
      const generatedTitle = await generateSessionTitle(userMessage.content);
      session.title = generatedTitle;
      console.log('[Tutor Controller] Auto-generated session title:', generatedTitle);
    }

    await session.save();

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage: aiMessage,
        sessionTitle: session.title,
        studentLevel: session.studentLevel
      }
    });
  } catch (error) {
    console.error('[Tutor Controller] Send message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error processing AI Tutor response'
    });
  }
};

/**
 * Renames a chat session manually
 */
exports.renameSession = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'New session title is required' });
    }

    const session = await verifySessionOwnership(req.params.id, req.user._id);
    session.title = title.trim();
    await session.save();

    res.json({
      success: true,
      message: 'Chat session renamed successfully',
      data: session
    });
  } catch (error) {
    console.error('[Tutor Controller] Rename session error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error renaming chat session'
    });
  }
};

/**
 * Deletes a chat session completely
 */
exports.deleteSession = async (req, res) => {
  try {
    const session = await verifySessionOwnership(req.params.id, req.user._id);
    await ChatSession.deleteOne({ _id: session._id });

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('[Tutor Controller] Delete session error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error deleting chat session'
    });
  }
};
