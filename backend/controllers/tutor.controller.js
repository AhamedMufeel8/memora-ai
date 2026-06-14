const ChatSession = require('../models/ChatSession');
const { generateTutorResponse, generateSessionTitle } = require('../services/tutor.service');

/**
 * Helper to ensure a session belongs to the requesting user
 */
const verifySessionOwnership = async (sessionId, userId) => {
  console.log(`[TUTOR] Performing session ownership validation. Session ID: ${sessionId}, Request User ID: ${userId}`);
  
  const session = await ChatSession.findById(sessionId);
  if (!session) {
    console.warn(`[TUTOR] Lookup failed: Chat session ${sessionId} not found.`);
    const error = new Error('Chat session not found');
    error.statusCode = 404;
    throw error;
  }
  
  console.log(`[TUTOR] Session owner: ${session.userId.toString()}, Requesting user: ${userId.toString()}`);
  if (session.userId.toString() !== userId.toString()) {
    console.warn(`[TUTOR] Ownership validation failed: Access denied to user ${userId} for session owned by ${session.userId}`);
    const error = new Error('Not authorized to access this session');
    error.statusCode = 403;
    throw error;
  }
  
  console.log(`[TUTOR] Ownership validation succeeded for session ${sessionId}`);
  return session;
};

/**
 * Creates a new, blank chat session for the authenticated user
 */
exports.createSession = async (req, res) => {
  try {
    const { studentLevel, title } = req.body;
    console.log('[TUTOR] POST /api/tutor hit. Creating session for user ID:', req.user._id);
    
    const newSession = new ChatSession({
      userId: req.user._id,
      title: title || 'New Chat Session',
      studentLevel: studentLevel || 'beginner',
      messages: []
    });

    const savedSession = await newSession.save();
    console.log('[TUTOR] Session created successfully in database. Session ID:', savedSession._id);
    
    res.status(201).json({
      success: true,
      message: 'New chat session created successfully',
      data: savedSession
    });
  } catch (error) {
    console.error('[TUTOR] Create session error:', error);
    res.status(500).json({ success: false, message: 'Server error creating chat session' });
  }
};

/**
 * Retrieves a list of all chat sessions for the authenticated user
 */
exports.listSessions = async (req, res) => {
  try {
    console.log('[TUTOR] GET /api/tutor hit. Listing sessions for user ID:', req.user._id);
    // Return sessions ordered by most recently updated
    const sessions = await ChatSession.find({ userId: req.user._id })
      .select('title studentLevel createdAt updatedAt')
      .sort({ updatedAt: -1 });

    console.log(`[TUTOR] Successfully listed ${sessions.length} sessions for user ${req.user._id}`);
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('[TUTOR] List sessions error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat sessions' });
  }
};

/**
 * Fetches the full message history of a single session
 */
exports.getSession = async (req, res) => {
  try {
    console.log(`[TUTOR] GET /api/tutor/${req.params.id} hit. Fetching session details.`);
    const session = await verifySessionOwnership(req.params.id, req.user._id);
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('[TUTOR] Get session error:', error);
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
    console.log(`[TUTOR] POST /api/tutor/${req.params.id}/chat hit. Sending user message.`);

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

    console.log('[TUTOR] Generating AI response from Gemini service...');
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
      console.log('[TUTOR] Generating automatic session title...');
      const generatedTitle = await generateSessionTitle(userMessage.content);
      session.title = generatedTitle;
      console.log('[TUTOR] Auto-generated session title:', generatedTitle);
    }

    await session.save();
    console.log('[TUTOR] Message history saved successfully. Dispatching response.');

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
    console.error('[TUTOR] Send message error:', error);
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
    console.log(`[TUTOR] PUT /api/tutor/${req.params.id} hit. Renaming session.`);
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'New session title is required' });
    }

    const session = await verifySessionOwnership(req.params.id, req.user._id);
    session.title = title.trim();
    await session.save();
    console.log('[TUTOR] Session renamed successfully to:', session.title);

    res.json({
      success: true,
      message: 'Chat session renamed successfully',
      data: session
    });
  } catch (error) {
    console.error('[TUTOR] Rename session error:', error);
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
    console.log(`[TUTOR] DELETE /api/tutor/${req.params.id} hit. Deleting session.`);
    const session = await verifySessionOwnership(req.params.id, req.user._id);
    await ChatSession.deleteOne({ _id: session._id });
    console.log('[TUTOR] Session deleted successfully from database.');

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('[TUTOR] Delete session error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error deleting chat session'
    });
  }
};
