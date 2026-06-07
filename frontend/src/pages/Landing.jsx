import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Zap, Sparkles, ChevronRight, Star, Play,
  Volume2, Award, FileText, ArrowRight,
  BookOpen, MessageSquare, CheckCircle2,
  Users, TrendingUp, Shield, Brain, Headphones,
  GraduationCap, Menu, X
} from 'lucide-react';

/* ─── Fade-in animation helper ─── */
const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Landing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  /* Navbar glass-on-scroll */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'AI Note Summarizer',
      desc: 'Drop heavy PDF textbooks and get crisp, structured summaries with key definitions in seconds.',
      accent: 'from-violet-500 to-indigo-500',
      glow: 'shadow-violet-500/20',
      iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    },
    {
      icon: Sparkles,
      title: 'AI Flashcard Decks',
      desc: 'AI builds study cards from your notes automatically. Practice with 3D flip dynamics.',
      accent: 'from-indigo-500 to-blue-500',
      glow: 'shadow-indigo-500/20',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      icon: Award,
      title: 'Smart MCQ Quizzes',
      desc: 'Custom MCQ and True/False assessments with timers, scoring, and instant feedback.',
      accent: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      icon: MessageSquare,
      title: '24/7 AI Tutor Chat',
      desc: 'Chat with an AI expert coach that references your uploaded books for precise answers.',
      accent: 'from-cyan-500 to-teal-500',
      glow: 'shadow-cyan-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },

    {
      icon: BookOpen,
      title: 'Book Library',
      desc: 'Your personal study shelf. Bookmark, annotate, and track reading progress.',
      accent: 'from-emerald-500 to-green-500',
      glow: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Students', icon: Users },
    { value: '2M+', label: 'Summaries Generated', icon: FileText },
    { value: '98%', label: 'Satisfaction Rate', icon: TrendingUp },
    { value: 'SOC2', label: 'Security Certified', icon: Shield },
  ];

  const testimonials = [
    {
      quote: "The PDF summarizer saved me during finals. I dropped 60-page biology decks and got complete outlines and quizzes instantly!",
      name: 'Sarah Jenkins',
      role: 'Pre-Med Undergrad',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&h=128&fit=crop',
      stars: 5,
    },
    {
      quote: "Converting notes to audio podcasts is a game changer. I listen on my commute and review flashcards on the way back.",
      name: 'Marcus Vance',
      role: 'CS Sophomore',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&h=128&fit=crop',
      stars: 5,
    },
    {
      quote: "Having an AI Tutor linked directly to my textbooks is incredible. Instant, precise, contextual explanations every time.",
      name: 'Elena Rostova',
      role: 'Postgrad Researcher',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&h=128&fit=crop',
      stars: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? '9' : '7',
      desc: 'For individuals exploring AI-powered study.',
      features: ['10 PDF uploads / mo', 'AI Summary Generator', '50 AI Flashcards', 'Smart Quiz access', 'Email support'],
      cta: 'Get Started Free',
      highlight: false,
    },
    {
      name: 'Scholar Pro',
      price: billingCycle === 'monthly' ? '19' : '15',
      desc: 'Full power for high-performing students.',
      features: ['Unlimited PDF uploads', 'Deep Chapter Analysis', 'Unlimited Flashcards', 'AI Chat Tutor + Books', 'Podcast Synthesis', 'Priority model access'],
      cta: 'Start Pro Trial',
      highlight: true,
    },
    {
      name: 'Team',
      price: billingCycle === 'monthly' ? '49' : '39',
      desc: 'For institutions, study groups & classrooms.',
      features: ['Everything in Pro', 'Shared study spaces', 'Teacher analytics', 'API integrations', '24/7 Slack support'],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <div className="bg-[#060a14] text-slate-100 font-sans min-h-screen overflow-x-hidden selection:bg-violet-500/25">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-200px] w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] bg-cyan-600/6 rounded-full blur-[120px]" />
        {/* Fine grid texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      {/* ══════════════════════════ NAVBAR ══════════════════════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-[#060a14]/85 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Memora <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Testimonials'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
                {link}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth?mode=login"
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5">
              Sign In
            </Link>
            <Link to="/auth?mode=signup"
              className="text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-400 hover:to-indigo-400 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 active:scale-[0.98]">
              Start Free
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0d1526]/95 backdrop-blur-xl border-t border-white/[0.06] px-6 py-6 space-y-4">
            {['Features', 'Pricing', 'Testimonials'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-slate-300 hover:text-white py-1">
                {link}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/auth?mode=login" className="text-center py-2.5 rounded-xl border border-white/10 text-sm text-slate-300">Sign In</Link>
              <Link to="/auth?mode=signup" className="text-center py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-bold">Start Free</Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">

         

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-7">
            <span className="text-white">Study Smarter</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Not Harder.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Upload notes, generate AI summaries, create flashcards, take quizzes, and chat with your personal AI tutor — all in one elegant platform.
          </motion.p>

          {/* CTA Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => navigate('/auth?mode=signup')}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 active:scale-[0.97] text-sm">
              Start Learning Free
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
           
          </motion.div>

          {/* Social proof micro-strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex -space-x-2.5">
              {['https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=64&h=64&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64&h=64&fit=crop',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&h=64&fit=crop',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=64&h=64&fit=crop',
              ].map((src, i) => (
                <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-[#060a14] object-cover" />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              <span className="text-slate-400 text-xs ml-1.5 font-medium">4.9/5 from 2,400+ reviews</span>
            </div>
          </motion.div>
        </div>

  
      
      </section>

      {/* ══════════════════════════ STATS STRIP ══════════════════════════ */}
      <section className="relative z-10 border-y border-white/[0.05] bg-[#0a0f1e]/60 backdrop-blur-md py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <FadeIn key={i} delay={i * 0.08} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-violet-400 mr-2" />
                  <span className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════ FEATURES ══════════════════════════ */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-18">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/6 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              <Zap className="w-3 h-3" />
              Core Features
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight">
              Everything You Need<br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">To Study Smarter</span>
            </h2>
            <p className="text-slate-400 leading-relaxed">From understanding concepts to acing exams, Memora AI gives you a complete intelligent study system.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <FadeIn key={idx} delay={idx * 0.07}>
                  <Link to="/auth?mode=signup" className="block h-full group">
                    <div className={`h-full p-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${feat.glow}`}>
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${feat.iconBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-2.5 group-hover:text-violet-300 transition-colors">{feat.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                      <div className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 group-hover:text-violet-400 transition-colors">
                        Explore feature <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ HOW IT WORKS ══════════════════════════ */}
      <section className="relative z-10 py-24 md:py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/6 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              <GraduationCap className="w-3 h-3" />
              How It Works
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight">
              From Upload to <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Mastery</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Upload Your Material', desc: 'Drag & drop any PDF — textbooks, lecture notes, research papers. We handle the rest.', icon: FileText, color: 'text-violet-400' },
              { step: '02', title: 'AI Processes & Creates', desc: 'Our Gemini AI engine generates summaries, flashcards, quizzes, and audio lessons automatically.', icon: Brain, color: 'text-indigo-400' },
              { step: '03', title: 'Learn & Retain', desc: 'Chat with your AI tutor, quiz yourself, and track your progress with detailed analytics.', icon: TrendingUp, color: 'text-cyan-400' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={i} delay={i * 0.12}>
                  <div className="relative p-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm h-full">
                    <div className="absolute top-6 right-6 text-5xl font-black text-white/[0.04] select-none">{step.step}</div>
                    <Icon className={`w-7 h-7 mb-5 ${step.color}`} />
                    <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TESTIMONIALS ══════════════════════════ */}
      <section id="testimonials" className="relative z-10 py-24 md:py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/6 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              <Star className="w-3 h-3 fill-amber-400" />
              Student Reviews
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Loved by Students
            </h2>
            <p className="text-slate-400 text-sm">See how students are transforming their studies with Memora AI.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-7 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm hover:border-white/[0.12] transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed flex-grow mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ PRICING ══════════════════════════ */}
      <section id="pricing" className="relative z-10 py-24 md:py-28 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/6 text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              <Zap className="w-3 h-3" />
              Simple Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Transparent Plans
            </h2>
            <p className="text-slate-400 text-sm">No setup fees, no surprises. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 mt-8 p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              {['monthly', 'annual'].map(cycle => (
                <button key={cycle} onClick={() => setBillingCycle(cycle)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${billingCycle === cycle ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-white'}`}>
                  {cycle === 'monthly' ? 'Monthly' : 'Annual · Save 20%'}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {pricingPlans.map((plan, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`relative h-full p-8 rounded-2xl border flex flex-col transition-all duration-300 ${plan.highlight
                  ? 'border-violet-500/50 bg-gradient-to-b from-violet-500/10 via-indigo-500/5 to-transparent shadow-2xl shadow-violet-500/15 scale-[1.02]'
                  : 'border-white/[0.07] bg-white/[0.03]'}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-slate-500 text-lg">$</span>
                      <span className="text-5xl font-extrabold text-white tracking-tighter">{plan.price}</span>
                      <span className="text-slate-500 text-sm">/ mo</span>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/[0.06] mb-6" />
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/auth?mode=signup')}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] ${plan.highlight
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-400 hover:to-indigo-400 shadow-lg shadow-violet-500/25'
                      : 'border border-white/10 text-slate-300 hover:bg-white/6 hover:text-white'}`}>
                    {plan.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FINAL CTA ══════════════════════════ */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-[#0d1020] to-indigo-950/30 p-12 md:p-18 text-center overflow-hidden shadow-2xl">
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-500/15 rounded-full blur-[80px]" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 text-violet-300 text-[10px] font-bold uppercase tracking-widest mb-7">
                  <Sparkles className="w-3 h-3" />
                  Join 50,000+ Students
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
                  Ready to Ace Your<br />
                  <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Next Exam?</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
                  Join thousands of students processing PDFs, mastering flashcards, and chatting with AI tutors every day.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => navigate('/auth?mode=signup')}
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 active:scale-[0.97]">
                    Create Free Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <Link to="/auth?mode=login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-[#050810] py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            {/* Brand col */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-400 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Memora AI</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                AI-powered study tools that help students learn faster, retain longer, and perform better.
              </p>
              <div className="flex gap-3 mt-5">
                {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
                  <a key={s} href="#" className="text-[10px] font-semibold text-slate-600 hover:text-slate-300 transition-colors border border-white/[0.06] px-3 py-1.5 rounded-lg hover:border-white/[0.15]">{s}</a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Platform', links: ['AI Summarizer', 'Flashcards', 'Smart Quiz', 'Book Library'] },
              { title: 'Resources', links: ['Student Guides', 'API Docs', 'Sample Library', 'Security'] },
              { title: 'Company', links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/[0.05] mb-7" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
            <p>© 2026 Memora AI Inc. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Built with <span className="text-rose-500">♥</span> for students worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
