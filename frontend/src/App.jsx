import { useState, useEffect } from 'react';
import {HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider} from './context/StudyContext';

// Views
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Summarizer } from './pages/Summarizer';
import { Flashcards } from './pages/Flashcards';
import { SmartQuiz } from './pages/SmartQuiz';
import { TutorChat } from './pages/TutorChat';
import { BookSection } from './pages/BookSection';
import { Settings } from './pages/Settings';

// Layouts & Reusables
import { DashboardLayout } from './layouts/DashboardLayout';
import { ToastContainer } from './components/Toast';
import { Onboarding } from './components/Onboarding';

// Gate wrapper protecting dashboard navigation routes
const GateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d19] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Orchestrates showing Onboarding overlay check
const AppContent = () => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      if (sessionStorage.getItem('show_onboarding') === 'true') {
        setTimeout(() => setShowTutorial(true), 0);
        sessionStorage.removeItem('show_onboarding');
      }
    }
  }, [user]);

  const handleTutorialClose = () => {
    setShowTutorial(false);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Core Dashboard Protected Gates */}
        <Route path="/dashboard" element={<GateRoute><Dashboard /></GateRoute>} />
        <Route path="/summarizer" element={<GateRoute><Summarizer /></GateRoute>} />
        <Route path="/flashcards" element={<GateRoute><Flashcards /></GateRoute>} />
        <Route path="/quiz" element={<GateRoute><SmartQuiz /></GateRoute>} />
        <Route path="/chat" element={<GateRoute><TutorChat /></GateRoute>} />
        <Route path="/books" element={<GateRoute><BookSection /></GateRoute>} />
        <Route path="/settings" element={<GateRoute><Settings /></GateRoute>} />
        
        {/* Wildcard Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer />
      <Onboarding isOpen={showTutorial} onClose={handleTutorialClose} />
    </>
  );
};

function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <StudyProvider>
            <AppContent />
          </StudyProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
