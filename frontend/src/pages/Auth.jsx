import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Loader2, Globe, Github } from 'lucide-react';

export const Auth = () => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') || 'login';

  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Use modeParam to directly determine isLogin, avoiding effect sync if possible
  // If we need state toggle, initialize based on it.
  const [isLoginState, setIsLoginState] = useState(modeParam === 'login');
  
  const isLogin = isLoginState;
  const setIsLogin = setIsLoginState;

  const { login, signup, loginWithSocial, loading } = useAuth();
  const { addToast } = useStudy();
  const navigate = useNavigate();

  // No effect needed, we rely on local state which mounts initially using param.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isForgot) {
      if (!email) {
        setErrorMsg('Please specify a valid email address.');
        return;
      }
      addToast('Reset instructions successfully dispatched to your email!', 'info');
      setIsForgot(false);
      setIsLogin(true);
      return;
    }

    try {
      if (isLogin) {
        if (!email || !password) {
          setErrorMsg('Please input both credentials.');
          return;
        }
        await login(email, password);
        addToast('Welcome back to your study desk!', 'success');
      } else {
        if (!name || !email || !password) {
          setErrorMsg('All fields are required.');
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          return;
        }
        await signup(name, email, password);
        addToast('Account created! Welcome to AI Study Platform.', 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Authentication failed. Please check your details and try again.';
      setErrorMsg(msg);
    }
  };

  const handleSocialClick = async (provider) => {
    setErrorMsg('');
    try {
      await loginWithSocial(provider);
      addToast(`Connected with ${provider}!`, 'success');
      navigate('/dashboard');
    } catch {
      setErrorMsg('Social login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow filters */}
      <div className="glow-orb w-[400px] h-[400px] bg-indigo-500/15 top-[20%] left-[-10%]" />
      <div className="glow-orb w-[400px] h-[400px] bg-cyan-500/10 bottom-[20%] right-[-10%]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md border border-slate-800/80 bg-slate-900/40 backdrop-blur-md p-8 rounded-3xl shadow-glass-dark relative z-10"
      >
        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="font-bold text-lg text-white">AI Study Platform</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {isForgot ? 'Recover Password' : isLogin ? 'Access Your Desk' : 'Create Student Profile'}
        </h2>
        <p className="text-slate-400 text-xs mb-6">
          {isForgot
            ? 'Input your email and we will send password recovery steps.'
            : isLogin
              ? 'Sign in to access your notes, cards, and quizzes.'
              : 'Register to unlock automated summarizes, audio and chat tutors.'}
        </p>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400 text-xs font-medium mb-5">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgot && (
            <div>
              <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:shadow-neon-indigo text-white flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isForgot ? (
              'Reset Password'
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {isForgot ? (
          <div className="text-center mt-6">
            <button
              onClick={() => setIsForgot(false)}
              className="text-xs text-indigo-400 font-semibold hover:text-indigo-300"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <>
            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-slate-800" />
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Or connection using</span>
              <div className="flex-grow h-px bg-slate-800" />
            </div>

            {/* Social logins */}
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              <button
                onClick={() => handleSocialClick('Google')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-850 hover:border-slate-700 bg-slate-950/30 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                <Globe className="w-4 h-4 text-rose-400" />
                Google
              </button>
              <button
                onClick={() => handleSocialClick('GitHub')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-850 hover:border-slate-700 bg-slate-950/30 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                <Github className="w-4 h-4 text-slate-400" />
                GitHub
              </button>
            </div>

            {/* Toggle State */}
            <p className="text-center text-xs text-slate-400">
              {isLogin ? "Don't have an account? " : 'Already registered? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg('');
                }}
                className="text-indigo-400 font-semibold hover:text-indigo-300"
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};
