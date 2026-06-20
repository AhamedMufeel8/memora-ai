import { useState, useEffect, lazy, Suspense } from 'react';
import {HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider} from './context/StudyContext';

// Views using lazy loading
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Summarizer = lazy(() => import('./pages/Summarizer').then(m => ({ default: m.Summarizer })));
const Flashcards = lazy(() => import('./pages/Flashcards').then(m => ({ default: m.Flashcards })));
const SmartQuiz = lazy(() => import('./pages/SmartQuiz').then(m => ({ default: m.SmartQuiz })));
const TutorChat = lazy(() => import('./pages/TutorChat').then(m => ({ default: m.TutorChat })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const PageLoading = () => (
  <div className="min-h-[400px] flex items-center justify-center bg-transparent">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
    </div>
  </div>
);

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
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Core Dashboard Protected Gates */}
          <Route path="/dashboard" element={<GateRoute><Dashboard /></GateRoute>} />
          <Route path="/summarizer" element={<GateRoute><Summarizer /></GateRoute>} />
          <Route path="/flashcards" element={<GateRoute><Flashcards /></GateRoute>} />
          <Route path="/quiz" element={<GateRoute><SmartQuiz /></GateRoute>} />
          <Route path="/chat" element={<GateRoute><TutorChat /></GateRoute>} />
          <Route path="/settings" element={<GateRoute><Settings /></GateRoute>} />
          
          {/* Wildcard Fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

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
