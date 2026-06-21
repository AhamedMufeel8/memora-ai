import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStudy } from '../context/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsService } from '../services/analytics.service';
import { API_BASE_URL } from '../config/api';
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  CreditCard,
  MessageSquare,
  Volume2,
  BookMarked,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  Flame,
  Award,
  Menu,
  X,
  Bell
} from 'lucide-react';

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { streak, points } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const routeToFeature = useMemo(() => ({
    '/summarizer': 'AI Summarizer',
    '/flashcards': 'AI Flashcards',
    '/quiz': 'AI Smart Quiz',
    '/chat': 'AI Tutor Chat',
  }), []);

  const activeSessionIdRef = useRef(null);
  const activeFeatureRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const hiddenTimeoutRef = useRef(null);

  const endActiveSession = async () => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId) return;
    activeSessionIdRef.current = null;
    activeFeatureRef.current = null;

    try {
      await analyticsService.endSession({ sessionId });
    } catch {
      // Best-effort: avoid breaking navigation/UI if analytics fails.
    }
  };

  const startFeatureSession = async (feature) => {
    if (!user || !feature) return;
    if (activeSessionIdRef.current && activeFeatureRef.current === feature) return;

    await endActiveSession();

    try {
      const response = await analyticsService.startSession({ feature });
      const sessionId = response?.data?.sessionId;
      if (sessionId) {
        activeSessionIdRef.current = sessionId;
        activeFeatureRef.current = feature;
        lastInteractionRef.current = Date.now();
      }
    } catch {
      // Best-effort: ignore.
    }
  };

  useEffect(() => {
    const feature = routeToFeature[location.pathname];
    if (!feature) {
      endActiveSession();
      return;
    }
    startFeatureSession(feature);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user, routeToFeature]);

  useEffect(() => {
    const bump = () => {
      lastInteractionRef.current = Date.now();
      if (hiddenTimeoutRef.current) {
        window.clearTimeout(hiddenTimeoutRef.current);
        hiddenTimeoutRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (!hiddenTimeoutRef.current) {
          hiddenTimeoutRef.current = window.setTimeout(() => {
            endActiveSession();
            hiddenTimeoutRef.current = null;
          }, 60_000);
        }
      } else {
        bump();
        const feature = routeToFeature[location.pathname];
        if (feature && user && !activeSessionIdRef.current) startFeatureSession(feature);
      }
    };

    const interval = window.setInterval(() => {
      const feature = routeToFeature[location.pathname];
      if (!feature || !activeSessionIdRef.current) return;
      const inactiveForMs = Date.now() - lastInteractionRef.current;
      if (inactiveForMs > 60_000) endActiveSession();
    }, 10_000);

    window.addEventListener('mousemove', bump, { passive: true });
    window.addEventListener('keydown', bump);
    window.addEventListener('scroll', bump, { passive: true });
    window.addEventListener('touchstart', bump, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    const onBeforeUnload = () => {
      const sessionId = activeSessionIdRef.current;
      const token = localStorage.getItem('token');
      if (!sessionId || !token) return;

      try {
        fetch(`${API_BASE_URL}/analytics/session/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
          keepalive: true,
        });
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('mousemove', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('scroll', bump);
      window.removeEventListener('touchstart', bump);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (hiddenTimeoutRef.current) window.clearTimeout(hiddenTimeoutRef.current);
      endActiveSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, routeToFeature, user]);

  const handleLogout = () => {
    endActiveSession();
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Summarizer', path: '/summarizer', icon: FileText },
    { name: 'AI Flashcards', path: '/flashcards', icon: CreditCard },
    { name: 'AI Smart Quiz', path: '/quiz', icon: Award },
    { name: 'AI Tutor Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  return (
    <div className="min-h-screen bg-lightBg dark:bg-[#080d19] text-textPrimary dark:text-slate-100 flex relative overflow-x-hidden font-sans transition-colors duration-200">
      {/* Desktop Sidebar (Left Panel) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 h-screen z-20 shadow-sm transition-colors duration-200">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border dark:border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-ai-cta flex items-center justify-center text-white font-bold text-lg shadow-ai-glow-soft dark:shadow-neon-indigo">
            A
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-aiAccent to-aiSecondary dark:from-indigo-400 dark:to-cyan-300 bg-clip-text text-transparent">
            AI Study Platform
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-grow p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ease-out ${isActive
                    ? 'bg-aiPrimary/10 text-aiAccent dark:text-cyan-400 border-l-4 border-aiAccent dark:border-indigo-500 shadow-sm'
                    : 'text-textSecondary dark:text-slate-400 hover:bg-aiPrimary/10 dark:hover:bg-slate-800/50 hover:text-textPrimary dark:hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-aiAccent dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-border dark:border-slate-800/60">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop'}
              alt={user?.name || 'User'}
              className="w-10 h-10 rounded-full border border-aiAccent/40 dark:border-indigo-500/40 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-textPrimary dark:text-white">{user?.name || 'Guest Student'}</p>
              <p className="text-xs text-textSecondary dark:text-slate-400 truncate">{user?.email || 'student@domain.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-aiAccent/35 text-aiAccent hover:bg-aiPrimary/10 transition-colors dark:border-rose-500/25 dark:text-rose-500 dark:hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar Shell */}
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 bottom-0 left-0 w-64 border-r border-border dark:border-slate-800/80 bg-white dark:bg-slate-900/90 backdrop-blur-md z-40 lg:hidden flex flex-col shadow-ai-card"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-ai-cta flex items-center justify-center text-white font-bold text-lg shadow-ai-glow-soft dark:shadow-neon-indigo">
                    A
                  </div>
                  <span className="font-semibold text-lg text-textPrimary dark:text-white">AI Study</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                          ? 'bg-aiPrimary/10 text-aiAccent dark:text-cyan-400 border-l-4 border-aiAccent dark:border-indigo-500'
                          : 'text-textSecondary dark:text-slate-400 hover:bg-aiPrimary/5 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border dark:border-slate-800/60">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop'}
                    alt="User"
                    className="w-10 h-10 rounded-full border border-aiAccent/40 dark:border-indigo-500/40 object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate text-textPrimary dark:text-white">{user?.name}</p>
                    <p className="text-xs text-textSecondary dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-aiAccent/35 text-aiAccent hover:bg-aiPrimary/10 transition-colors dark:border-rose-500/25 dark:text-rose-500 dark:hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Panel Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-textSecondary dark:text-slate-400 hover:bg-aiPrimary/5 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-base sm:text-lg text-textPrimary dark:text-white font-sans hidden md:block truncate">
              Welcome back, {user?.name || 'Learner'}!
            </h1>
          </div>

          {/* Gamified Widgets (Streak, points, theme, profile) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Widget */}
           

            
            

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border dark:border-slate-800 text-textSecondary dark:text-slate-400 hover:bg-aiPrimary/5 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-aiAccent dark:text-indigo-600" />}
            </button>

           

            {/* Micro User Avatar */}
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop'}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-border dark:border-slate-800 object-cover cursor-pointer"
              onClick={() => navigate('/settings')}
            />
          </div>
        </header>

        {/* View Content Area */}
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
