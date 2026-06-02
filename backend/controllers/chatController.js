const Chat = require('../models/Chat');
const Note = require('../models/Note');
const User = require('../models/User');
const aiService = require('../services/aiService');

/**
 * @desc    Get user's AI Tutor chat history
 * @route   GET /api/chat
 * @access  Private
 */
const getChatHistory = async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.user._id });

    // If chat doesn't exist, create a welcome message to wow the user
    if (!chat) {
      chat = await Chat.create({
        userId: req.user._id,
        messages: [
          {
            sender: 'ai',
            text: 'Hello! I am your premium AI Study Coach. 🧠✨ How can I help you master your curriculum today? You can ask me general study questions or upload PDF notes to ask specific context-based questions!',
            time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          }
        ]
      });
    }

    res.json({
      success: true,
      data: chat.messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send a message to the AI Tutor & retrieve response (with optional RAG context)
 * @route   POST /api/chat
 * @access  Private
 */
const sendMessage = async (req, res) => {
  const { text, noteId } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Please specify message text' });
  }

  try {
    let chat = await Chat.findOne({ userId: req.user._id });
    if (!chat) {
      chat = await Chat.create({ userId: req.user._id, messages: [] });
    }

    // Retrieve context if noteId is provided for RAG
    let context = '';
    if (noteId) {
      const note = await Note.findOne({ _id: noteId, userId: req.user._id });
      if (note) {
        context = aiService.retrieveContext(text, note.chunks);
      }
    }

    // Generate AI response
    const aiResponseText = await aiService.generateTutorChat(text, context);

    // Push both messages
    const timeStr = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    chat.messages.push({
      sender: 'user',
      text,
      time: timeStr
    });

    chat.messages.push({
      sender: 'ai',
      text: aiResponseText,
      time: timeStr
    });

    await chat.save();

    // Reward user with 5 XP for active tutoring sessions
    const user = await User.findById(req.user._id);
    if (user) {
      user.xp += 5;
      await user.save();
    }

    res.json({
      success: true,
      data: chat.messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Clear chat history and reset to welcome message
 * @route   DELETE /api/chat
 * @access  Private
 */
const clearChatHistory = async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.user._id });
    if (chat) {
      chat.messages = [
        {
          sender: 'ai',
          text: 'Hello! I am your premium AI Study Coach. 🧠✨ How can I help you master your curriculum today? You can ask me general study questions or upload PDF notes to ask specific context-based questions!',
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        }
      ];
      await chat.save();
    }
    
    res.json({
      success: true,
      message: 'Chat history cleared successfully',
      data: chat ? chat.messages : []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  clearChatHistory
};
