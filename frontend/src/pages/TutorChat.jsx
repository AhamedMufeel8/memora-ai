import { useState, useRef, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { tutorService } from '../services/tutor.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Paperclip,
  HelpCircle,
  FileIcon,
  User,
  Trash2,
  Edit3,
  Check,
  X,
  Copy,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Search,
  Plus,
  Menu,
  GraduationCap,
  MessageSquare,
  Volume2
} from 'lucide-react';

// Custom lightweight high-fidelity Markdown Renderer component to avoid dependencies
const MarkdownText = ({ text }) => {
  if (!text) return null;

  // Split text by code blocks if any
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-xs leading-relaxed font-sans select-text">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code content
          const match = part.match(/```(\w*)\n([\s\S]*?)```/) || [null, '', part.slice(3, -3)];
          const language = match[1];
          const codeContent = match[2];

          return (
            <pre key={index} className="p-4 my-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 overflow-x-auto font-mono text-[10px] shadow-sm leading-normal">
              {language && (
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 border-b border-slate-900 pb-1 flex justify-between">
                  <span>{language}</span>
                  <span className="text-slate-600 font-normal">syntax-highlighted</span>
                </div>
              )}
              <code>{codeContent.trim()}</code>
            </pre>
          );
        }

        // Process line-by-line for headings, lists, bold text
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();

              // Empty lines
              if (!trimmed) return <div key={lineIdx} className="h-1.5" />;

              // Headings: # Heading, ## Heading, etc.
              if (trimmed.startsWith('# ')) {
                return (
                  <h3 key={lineIdx} className="text-[13px] font-bold text-aiAccent dark:text-cyan-400 mt-4 mb-2 first:mt-0 flex items-center gap-1.5 border-b border-border dark:border-slate-800 pb-1 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-aiAccent dark:text-indigo-500" />
                    {trimmed.slice(2)}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                const headingText = trimmed.startsWith('## ') ? trimmed.slice(3) : trimmed.slice(4);
                return (
                  <h4 key={lineIdx} className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1.5">
                    {headingText}
                  </h4>
                );
              }

              // Bullet Points: • , - , * 
              if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const listContent = trimmed.replace(/^[•\-*]\s*/, '');
                
                // Parse bold strings inside list
                return (
                  <ul key={lineIdx} className="list-none pl-3 space-y-1">
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-350">
                      <span className="text-aiAccent dark:text-cyan-400 mt-1 select-none flex-shrink-0 text-base">•</span>
                      <span>{parseBoldText(listContent)}</span>
                    </li>
                  </ul>
                );
              }

              // Normal paragraph line
              return (
                <p key={lineIdx} className="text-slate-700 dark:text-slate-350">
                  {parseBoldText(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Simple bold string parser: **text** -> <strong>text</strong>
const parseBoldText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const TutorChat = () => {
  const { documents, books, addToast } = useStudy();

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [typingSessionId, setTypingSessionId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [studentLevel, setStudentLevel] = useState('beginner');

  // Sidebar search and responsive controls
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Renaming chat state
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // RAG Context selection
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const currentSessionIdRef = useRef(null);
  const isTyping = typingSessionId === currentSessionId;

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
    if (currentSessionId) {
      // Store current session ID for restoration on reload
      localStorage.setItem('tutor_currentSessionId', currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      const savedMessages = localStorage.getItem(`messages_${currentSessionId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(`messages_${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  // Suggested Follow-up queries
  const suggestedFollowUps = [
    "Give me more examples of this",
    "Explain this as if I'm a beginner",
    "Break down the math or internal logic",
    "Create a 3-question revision quiz"
  ];

  // Templates shown when no session exists or history is empty
  const initialStarterTemplates = [
    { title: "Explain Schrödinger Superposition", query: "Explain Schrödinger Wave Superposition in simple terms." },
    { title: "List React Render hooks guide", query: "List key takeaways from Advanced React Rendering hooks guide." },
    { title: "Quantum Duality Overview", query: "Can you provide a simple explanation and example of wave-particle duality?" }
  ];

  // Fetch session history summaries on mount and restore last session if valid
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await tutorService.getSessions();
        if (response.success) {
          const fetchedSessions = response.data;
          setSessions(fetchedSessions);
          
          const saved = localStorage.getItem('tutor_currentSessionId');
          if (saved && fetchedSessions.some(s => s._id === saved)) {
            await loadSession(saved);
          } else {
            // If the saved session ID is invalid or doesn't belong to the user,
            // clear it and load the most recent session if available, otherwise clear everything
            localStorage.removeItem('tutor_currentSessionId');
            if (fetchedSessions.length > 0) {
              await loadSession(fetchedSessions[0]._id);
            } else {
              setCurrentSessionId(null);
              setMessages([]);
            }
          }
        }
      } catch (error) {
        console.error('Fetch sessions failed:', error);
        addToast('Failed to load chat history from backend.', 'error');
      }
    };

    initializeChat();
  }, []);

  // Fetch sessions from the backend
  const fetchSessions = async (selectFirst = false) => {
    try {
      const response = await tutorService.getSessions();
      if (response.success) {
        setSessions(response.data);
        if (selectFirst && response.data.length > 0) {
          loadSession(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Fetch sessions failed:', error);
      addToast('Failed to load chat history from backend.', 'error');
    }
  };

  // Load a single session details and full history
  const loadSession = async (sessionId) => {
    setLoadingHistory(true);
    setCurrentSessionId(sessionId);
    setSelectedAttachment(null);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
    try {
      const response = await tutorService.getSession(sessionId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
        setStudentLevel(response.data.studentLevel || 'beginner');
      } else {
        throw new Error(response.message || 'Failed to fetch session details');
      }
    } catch (error) {
      console.error('Load session details failed:', error);
      addToast('Failed to fetch conversation history.', 'error');
      setCurrentSessionId(null);
      setMessages([]);
      localStorage.removeItem('tutor_currentSessionId');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Create a brand new session
  const handleNewChat = async (initialQuery = null) => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
    try {
      const response = await tutorService.createSession({
        studentLevel: studentLevel,
        title: 'New Chat Session'
      });

      if (response.success && response.data) {
        const newSession = response.data;
        
        // Add to active sessions list
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession._id);
        setMessages([]);

        if (initialQuery) {
          // If query was passed (e.g. starter templates), send it right away
          await handleSendQuery(initialQuery, newSession._id);
        } else {
          // Put cursor on input
          setTimeout(() => chatInputRef.current?.focus(), 100);
        }
      }
    } catch (error) {
      console.error('Create chat session failed:', error);
      addToast('Failed to start a new chat session.', 'error');
    }
  };

  // Scroll smoothly to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Main sending handler
  const handleSendQuery = async (queryText = null, targetSessionId = null) => {
    const activeQuery = queryText || inputVal;
    if (!activeQuery.trim()) return;

    const activeSessionId = targetSessionId || currentSessionId;
    if (!activeSessionId) {
      // If there is no session active, automatically create one first and then send
      await handleNewChat(activeQuery);
      return;
    }

    // Capture context reference text if selected (RAG simulation preparation)
    let contextText = "";
    if (selectedAttachment) {
      // Include the actual summary generated for the document, if available
      const summary = selectedAttachment.summary || '';
      contextText = `Reference Document: "${selectedAttachment.name}" (${selectedAttachment.size}). Summary: ${summary}`;
    }

    // Add local optimistic user message to bubble thread
    const localUserMsg = {
      _id: `temp_${Date.now()}`,
      role: 'user',
      content: activeQuery.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, localUserMsg]);
    setInputVal('');
    setSelectedAttachment(null);
    setShowAttachMenu(false);
    setTypingSessionId(activeSessionId);

    try {
      const response = await tutorService.sendMessage(activeSessionId, {
        message: activeQuery,
        studentLevel: studentLevel,
        contextDocs: contextText
      });

      if (response.success && response.data) {
        if (currentSessionIdRef.current === activeSessionId) {
          // Append response assistant message only into the visible session.
          setMessages(prev => {
            const filtered = prev.filter(m => !String(m._id || '').startsWith('temp_'));
            return [...filtered, response.data.userMessage, response.data.assistantMessage];
          });
        }

        // Update levels/titles locally in session summary list
        setSessions(prev =>
          prev.map(s =>
            s._id === activeSessionId
              ? { ...s, title: response.data.sessionTitle, studentLevel: response.data.studentLevel }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Send message failed:', error);
      if (currentSessionIdRef.current === activeSessionId) {
        setMessages(prev => prev.filter(m => !String(m._id || '').startsWith('temp_')));
      }
      addToast(error?.message || 'AI Tutor failed to respond. Please check server.', 'error');
    } finally {
      setTypingSessionId(prev => (prev === activeSessionId ? null : prev));
    }
  };

  // Regenerate last AI response
  const handleRegenerate = async () => {
    if (messages.length < 2) return;
    
    // Find the last user message
    const historyReversed = [...messages].reverse();
    const lastUserMessage = historyReversed.find(m => m.role === 'user');
    
    if (lastUserMessage) {
      // Strip out the last assistant message
      setMessages(prev => prev.slice(0, -1));
      setTypingSessionId(currentSessionId);
      
      try {
        const response = await tutorService.sendMessage(currentSessionId, {
          message: lastUserMessage.content,
          studentLevel: studentLevel
        });

        if (response.success && response.data) {
          if (currentSessionIdRef.current === currentSessionId) {
            setMessages(prev => [...prev, response.data.assistantMessage]);
          }
        }
      } catch (error) {
        console.error('Regenerate failed:', error);
        addToast('Regeneration failed.', 'error');
      } finally {
        setTypingSessionId(prev => (prev === currentSessionId ? null : prev));
      }
    }
  };

  // Copy helper
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Copied text response to clipboard!', 'success');
    } catch {
      addToast('Failed to copy.', 'error');
    }
  };

  // Session rename trigger
  const triggerRename = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session._id);
    setEditingTitle(session.title);
  };

  // Save manual rename
  const saveRename = async (sessionId, e) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      const response = await tutorService.renameSession(sessionId, editingTitle.trim());
      if (response.success) {
        setSessions(prev =>
          prev.map(s => (s._id === sessionId ? { ...s, title: editingTitle.trim() } : s))
        );
        setEditingSessionId(null);
        addToast('Chat renamed successfully.', 'success');
      }
    } catch (error) {
      console.error('Rename failed:', error);
      addToast('Rename failed.', 'error');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat history session permanently?')) return;

    try {
      const response = await tutorService.deleteSession(sessionId);
      if (response.success) {
        setSessions(prev => prev.filter(s => s._id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        addToast('Chat session deleted.', 'success');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      addToast('Delete failed.', 'error');
    }
  };

  // Attach RAG helper context
  const handleAttachContext = (doc) => {
    // Attach the full document object, which includes its AI‑generated summary
    setSelectedAttachment(doc);
    setShowAttachMenu(false);
    addToast(`Attached ${doc.name} as study reference!`, 'success');
  };

  // Filter sessions by search text
  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans h-[calc(100vh-11rem)] sm:h-[calc(100vh-12rem)] lg:h-[calc(100vh-8.5rem)] flex flex-col justify-between overflow-hidden">
      {/* Title Header with Sidebar Toggle button */}
      <div className="flex-shrink-0 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-slate-850/50 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-colors"
            title="Toggle Sidebar History"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Study Tutor
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">Your personal learning assistant. Ask questions, understand concepts, and get instant explanations.</p>
          </div>
        </div>

      </div>

      {/* Main Panel Content (Sidebar + Active Chat screen) */}
      <div className="flex-grow flex items-stretch gap-4 min-h-0 relative">
        
        {/* Sidebar History (Left Panel) */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden"
            />
          )}

          {isSidebarOpen && (
            <motion.div
              initial={isMobile ? { x: '-100%' } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 280, opacity: 1 }}
              exit={isMobile ? { x: '-100%' } : { width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`${isMobile ? 'fixed top-0 bottom-0 left-0 w-[280px] z-40 rounded-r-2xl border-r' : 'flex-shrink-0 w-[280px] border'} border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 backdrop-blur-md flex flex-col justify-between overflow-hidden shadow-sm h-full`}
            >
              {isMobile && (
                <div className="flex justify-between items-center px-4 pt-4">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">Chat History</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-650 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Search and Action bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-850 space-y-3">
                <button
                  onClick={() => handleNewChat()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-500 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Start New Session</span>
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search chat sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-[11px] bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Chat Session Scroll list */}
              <div className="flex-grow overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {filteredSessions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-[11px]">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700 animate-pulse-slow" />
                    <span>No previous sessions found</span>
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isSelected = currentSessionId === session._id;
                    const isEditing = editingSessionId === session._id;

                    return (
                      <div
                        key={session._id}
                        onClick={() => !isEditing && loadSession(session._id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all relative group ${isSelected
                            ? 'border-indigo-500/35 bg-indigo-500/5 text-slate-800 dark:text-slate-100 shadow-sm'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/25'
                          }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-grow">
                          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
                          
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(session._id, e);
                                if (e.key === 'Escape') setEditingSessionId(null);
                              }}
                              className="text-[11px] font-bold px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-950 dark:text-white focus:outline-none flex-grow"
                            />
                          ) : (
                            <div className="overflow-hidden">
                              <h4 className="text-[11px] font-bold truncate pr-6">{session.title}</h4>
                              <p className="text-[8px] text-slate-400 mt-0.5 uppercase font-semibold tracking-wider">Level: {session.studentLevel}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-0.5 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent pl-4 py-1.5 rounded-r-xl">
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => saveRename(session._id, e)}
                                className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }}
                                className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => triggerRename(session, e)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Rename Chat"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteSession(session._id, e)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                                title="Delete Chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer info */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-950/10 flex items-center justify-between text-[8px] font-bold text-slate-400 tracking-wider uppercase">
                <span>AI Tutor Model v1.5</span>
                <span>Active</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Message Box & Inputs (Right Panels) */}
        <div className="flex-grow border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/65 backdrop-blur-md rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm h-full">
          
          {loadingHistory ? (
            // Loading History skeleton
            <div className="flex-grow flex flex-col items-center justify-center space-y-3">
              <Plus className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-[11px] font-bold text-slate-400 animate-pulse">Retrieving chat records...</p>
            </div>
          ) : !currentSessionId && messages.length === 0 ? (
            // Blank Welcome dashboard display
            <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-8">
              <div className="space-y-2 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-md">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Start Your Learning Session</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Hello! I am your personal AI Study Coach. I can help you learn anything you want! 
                </p>
              </div>

              {/* Suggested starter templates grids */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                {initialStarterTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleNewChat(tpl.query)}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/20 text-left hover:border-indigo-500 hover:shadow-neon-indigo/5 transition-all space-y-1.5"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{tpl.title}</h4>
                    <p className="text-[9px] text-slate-400 leading-normal line-clamp-2">Click to start session on this query.</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Active message scroll view
            <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const formattedTime = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div
                    key={msg._id || index}
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${isUser
                        ? 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/25 shadow-neon-indigo'
                      }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Chat bubble body */}
                    <div className="space-y-1">
                      <div className={`p-4 rounded-2xl ${isUser
                          ? 'bg-indigo-500 text-white rounded-tr-none shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/80 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-glass-light dark:shadow-none'
                        }`}>
                        {isUser ? (
                          <p className="text-xs leading-relaxed whitespace-pre-line">{msg.content}</p>
                        ) : (
                          <MarkdownText text={msg.content} />
                        )}
                      </div>

                      {/* Msg actions footer (Only for AI Assistant responses) */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[8px] text-slate-400 font-bold tracking-wider">{formattedTime}</span>
                        {!isUser && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(msg.content)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                              title="Copy response"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {index === messages.length - 1 && (
                              <button
                                onClick={handleRegenerate}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                                title="Regenerate response"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Thinking typing indicator */}
              {isTyping && (
                <div className="flex gap-3 max-w-[70%]">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="space-y-1">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/80 rounded-tl-none">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider animate-pulse flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-indigo-500 animate-bounce" />
                          AI Tutor is thinking...
                        </span>
                        <div className="flex items-center gap-1.5 pl-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested follow ups */}
              {!isTyping && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                <div className="pl-11 space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-indigo-400" />
                    Suggested follow-up questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedFollowUps.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendQuery(prompt)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 text-slate-600 dark:text-slate-400 text-[10px] font-semibold hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-cyan-400 hover:bg-slate-100/30 transition-all flex items-center gap-1"
                      >
                        <span>{prompt}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Form input controls */}
          <div className="p-4 border-t border-slate-150 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-950/15 relative">
            {/* Context attachment display indicator */}
            {selectedAttachment && (
              <div className="absolute top-0 left-4 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-500 bg-white dark:bg-slate-900 text-[10px] font-bold text-indigo-500 shadow-sm animate-pulse-slow">
                <FileIcon className="w-3.5 h-3.5" />
                <span>Reference: {selectedAttachment.name}</span>
                <button onClick={() => setSelectedAttachment(null)} className="hover:text-rose-500 ml-1 font-bold text-sm">
                  ×
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="flex items-center gap-2"
            >
              {/* Attachment Button */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isTyping || !currentSessionId}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`p-2.5 rounded-xl border transition-colors disabled:opacity-40 ${selectedAttachment
                      ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-white dark:bg-slate-950/10'
                    }`}
                  title="Link Study Reference Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Dropdown document attach lists */}
                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-12 left-0 w-64 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-lg p-3 z-30"
                    >
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Select Study Context</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {documents.map(doc => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => handleAttachContext(doc)}
                            className="w-full text-left p-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 truncate flex items-center gap-2"
                          >
                            <FileIcon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </button>
                        ))}
                        {documents.length === 0 && (
                          <p className="text-[10px] text-slate-400 text-center py-2">No documents to link.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                ref={chatInputRef}
                type="text"
                disabled={isTyping}
                placeholder="Ask your AI Study Coach a question..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onFocus={scrollToBottom}
                className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={isTyping || !inputVal.trim()}
                className="px-4 py-2.5 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-100 dark:disabled:bg-slate-850 text-white disabled:text-slate-400 flex items-center justify-center shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
