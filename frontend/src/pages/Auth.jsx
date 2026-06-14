import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, ArrowLeft, Loader2, 
  Eye, EyeOff, Shield, Check, Sparkles, BookOpen, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';

export const Auth = () => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') || 'login';

  const [isForgot, setIsForgot] = useState(false);
  const [isLoginState, setIsLoginState] = useState(modeParam === 'login');
  
  const isLogin = isLoginState;
  const setIsLogin = (val) => {
    setIsLoginState(val);
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Password Validation Checks
  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  const { login, signup, googleLogin, loading } = useAuth();
  const { addToast } = useStudy();
  const navigate = useNavigate();

  const isSubmitDisabled = loading || localLoading;

  // Particle Canvas Ref and Effect
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(Math.floor(canvas.width / 12), 40);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          alpha: Math.random() * 0.4 + 0.15
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`; // Indigo shade
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sync mode changes from Query Search Parameter
  useEffect(() => {
    setIsLogin(modeParam === 'login');
  }, [modeParam]);

  // Real-time password verification on change
  const handlePasswordChange = (val) => {
    setPassword(val);
    setPwdChecks({
      length: val.length >= 6,
      uppercase: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val)
    });
  };

  const getPasswordStrength = () => {
    if (!password) return { text: 'None', pct: 0, color: 'bg-slate-800' };
    const passedChecks = Object.values(pwdChecks).filter(Boolean).length;
    if (passedChecks <= 1) return { text: 'Weak', pct: 25, color: 'bg-rose-500' };
    if (passedChecks === 2) return { text: 'Fair', pct: 50, color: 'bg-amber-500' };
    if (passedChecks === 3) return { text: 'Good', pct: 75, color: 'bg-indigo-500' };
    return { text: 'Strong', pct: 100, color: 'bg-emerald-500' };
  };

  const validateForm = () => {
    if (isForgot) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setErrorMsg('Please specify a valid email address.');
        return false;
      }
      return true;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setErrorMsg('Full Name is required.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return false;
      }
      const strength = getPasswordStrength();
      if (strength.pct < 50) {
        setErrorMsg('Please choose a stronger password.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateForm()) return;

    setLocalLoading(true);
    try {
      if (isForgot) {
        console.log('[AUTH_CONTEXT] Despatching password recovery instructions for:', email);
        addToast('Reset instructions successfully dispatched to your email!', 'info');
        setIsForgot(false);
        setIsLogin(true);
      } else if (isLogin) {
        console.log('[AUTH_CONTEXT] Logging in user with email:', email);
        await login(email, password, rememberMe);
        addToast('Welcome back to your study desk!', 'success');
        console.log('[GOOGLE_AUTH] Redirecting user to /dashboard...');
        navigate('/dashboard');
      } else {
        console.log('[AUTH_CONTEXT] Registering user with email:', email);
        await signup(name, email, password);
        addToast('Account created! Welcome to AI Study Platform.', 'success');
        console.log('[GOOGLE_AUTH] Redirecting user to /dashboard...');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Authentication failed. Please verify details and try again.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLocalLoading(true);
    console.log('[GOOGLE_AUTH] Google button clicked. Initiating Firebase signInWithPopup...');

    try {
      console.log('[FIREBASE] signInWithPopup opened...');
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        console.log('[FIREBASE] User selected account. Firebase returned user:', result.user.email);
        
        console.log('[FIREBASE] Generating ID Token...');
        const idToken = await result.user.getIdToken();
        console.log('[GOOGLE_AUTH] Received Firebase ID Token. Transitioning to context login...');
        
        console.log('[AUTH_CONTEXT] Calling context.googleLogin()...');
        await googleLogin(idToken, rememberMe);
        
        addToast('Google Login Successful!', 'success');
        console.log('[GOOGLE_AUTH] Authentication successful. Redirecting user to /dashboard...');
        navigate('/dashboard');
      } else {
        throw new Error('Google identity popup cancelled or failed.');
      }
    } catch (error) {
      console.error('[GOOGLE_AUTH] Authentication flow failed:', error);
      const msg = error.message || 'Google login failed';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col md:flex-row overflow-hidden font-sans text-slate-100">
      
    

      {/* RIGHT PANEL: Auth Card Form */}
      <div className="flex-grow flex items-center justify-center p-6 relative">
        
        {/* Glow Effects on Mobile/Background */}
        <div className="md:hidden absolute top-[15%] left-[10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="md:hidden absolute bottom-[15%] right-[10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          
          {/* Back Navigation Link */}
          <button
            onClick={() => navigate('/')}
            disabled={isSubmitDisabled}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>

          {/* Form Widget Wrapper with Premium Glassmorphism styling */}
          <div className="border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 shadow-glass-dark relative overflow-hidden">
            
            {/* Glossy gradient top-border effect */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500 to-cyan-400" />

            <div className="mb-6">
              
              {/* Brand Header for Mobile View */}
              <div className="flex md:hidden items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm">
                  M
                </div>
                <span className="font-extrabold text-sm text-white">Memora AI</span>
              </div>

              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {isForgot ? 'Reset Password' : isLogin ? 'Access Your Desk' : 'Create Student Profile'}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5">
                {isForgot
                  ? 'Input your email to get recovery credentials.'
                  : isLogin
                    ? 'Welcome back! Login to resumes your studies.'
                    : 'Register to unlock dynamic flashcards, audio and summaries.'}
              </p>
            </div>

            {/* Error Message Box */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-medium mb-5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Standard Credential Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name (Signup Mode) */}
              {!isLogin && !isForgot && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      disabled={isSubmitDisabled}
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    disabled={isSubmitDisabled}
                    placeholder="studentname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Container (Exclude on Forgot View) */}
              {!isForgot && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400">Password</label>
                    {/* {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsForgot(true)}
                        disabled={isSubmitDisabled}
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                      >
                        Forgot Password?
                      </button>
                    )} */}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isSubmitDisabled}
                      placeholder={isLogin ? 'Enter password' : 'Create secure password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitDisabled}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                 
                </div>
              )}

              {/* Confirm Password (Signup Mode only) */}
              {!isLogin && !isForgot && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isSubmitDisabled}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                    />
                    {confirmPassword && (
                      <div className="absolute right-3.5 top-3">
                        {password === confirmPassword ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remember Me Checkbox (Exclude on Forgot View) */}
              {!isForgot && (
                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={isSubmitDisabled}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950/60 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 transition-all cursor-pointer"
                    />
                    <span className="text-[10px] font-medium text-slate-400 hover:text-slate-300 transition-colors">
                      Remember Me
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:shadow-neon-indigo text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none"
              >
                {isSubmitDisabled ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isForgot ? (
                  'Reset Password'
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Social Logins Divider & Buttons */}
            {isForgot ? (
              <div className="text-center mt-6">
                <button
                  onClick={() => setIsForgot(false)}
                  disabled={isSubmitDisabled}
                  className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors disabled:opacity-50"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center my-6">
                  <div className="flex-grow h-[1px] bg-slate-800/80" />
                  <span className="px-3.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Or connect using
                  </span>
                  <div className="flex-grow h-[1px] bg-slate-800/80" />
                </div>

                <div className="space-y-3">
                  
                  {/* Google Authenticator Button */}
                  <button
                    type="button"
                    disabled={isSubmitDisabled}
                    onClick={handleGoogleLogin}
                    className="relative flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.58h3.32c1.94,-1.78 3.05,-4.41 3.05,-7.44c0,-0.64 -0.06,-1.27 -0.17,-1.94z" fill="#4285F4" />
                        <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-2.92,-2.26c-0.81,0.54 -1.85,0.86 -3.04,0.86c-2.34,0 -4.32,-1.58 -5.03,-3.7H3.54v2.33c1.48,2.94 4.53,4.97 8.08,4.97z" fill="#34A853" />
                        <path d="M6.97,13.3c-0.18,-0.54 -0.28,-1.12 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.57H3.54c-0.62,1.24 -0.97,2.65 -0.97,4.13c0,1.48 0.35,2.89 0.97,4.13l3.43,-2.33z" fill="#FBBC05" />
                        <path d="M12,6.1c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.47,3.35 14.43,2.6 12,2.6c-3.55,0 -6.6,2.03 -8.08,4.97l3.43,2.33c0.71,-2.12 2.69,-3.7 5.03,-3.7z" fill="#EA4335" />
                      </g>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Form Transition Toggle */}
                <p className="text-center text-xs text-slate-400 mt-6">
                  {isLogin ? "Don't have an account? " : 'Already registered? '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    disabled={isSubmitDisabled}
                    className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    {isLogin ? 'Sign up here' : 'Sign in here'}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
