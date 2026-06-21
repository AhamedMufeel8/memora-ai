import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Sparkles, ChevronRight, Star,
  Award, FileText, ArrowRight,
  MessageSquare, CheckCircle2,
  Users, TrendingUp, Shield, Brain,
  GraduationCap, Menu, X, ArrowUpRight
} from 'lucide-react';

/* ─── Smooth Animation Helper ─── */
const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
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

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'AI Note Summarizer',
      desc: 'Upload 100-page textbooks or lecture PDFs and get clear, structured study guides with key definitions in seconds.',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      icon: Sparkles,
      title: 'Smart Flashcards',
      desc: 'Automatically generate flashcards from your notes and reinforce learning through active recall.',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      icon: Award,
      title: 'Practice Quizzes',
      desc: 'Test your understanding with AI-generated questions tailored to your study materials.',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      icon: MessageSquare,
      title: '24/7 AI Study Tutor',
      desc: 'Ask questions, get explanations, and learn difficult concepts with a tutor that understands your documents.',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Students', icon: Users },
    { value: '2M+', label: 'Study Guides Created', icon: FileText },
    { value: '98%', label: 'Higher Exam Scores', icon: TrendingUp },
    { value: 'Safe', label: '100% Secure Data', icon: Shield },
  ];

  const testimonials = [
    {
      quote: "The PDF summarizer completely saved me during biology finals. I uploaded massive lecture slide decks and got clean outlines and quick practice questions immediately.",
      name: 'Sarah Jenkins',
      role: 'Pre-Med Student',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&h=128&fit=crop',
      stars: 5,
    },
    {
      quote: "Generating custom flashcard decks straight from my class notes has cut my preparation time in half. It isolates what I need to study perfectly.",
      name: 'Marcus Vance',
      role: 'Computer Science Sophomore',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&h=128&fit=crop',
      stars: 5,
    },
    {
      quote: "The dashboard layout is simple and gorgeous. Having an AI chat assistant that remembers my exact textbook chapters makes getting stuck impossible.",
      name: 'Elena Rostova',
      role: 'Graduate Researcher',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&h=128&fit=crop',
      stars: 5,
    },
  ];

  return (
    <div className="bg-[#030712] text-slate-200 font-sans min-h-screen overflow-x-hidden selection:bg-emerald-500/30 tracking-tight antialiased">

      {/* ── Premium Ambient Background Blur ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-500/10 to-transparent rounded-full blur-[140px] opacity-70" />
        <div className="absolute top-[35%] right-[-100px] w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ══════════════════════════ NAVIGATION BAR ══════════════════════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navScrolled || mobileOpen ? 'bg-[#030712]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              Memora <span className="text-emerald-400 font-medium">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Testimonials'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth?mode=login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="text-xs font-bold px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-100 transition-all shadow-md">
              Start Free
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#030712]/98 backdrop-blur-xl px-6 py-5 flex flex-col gap-1">
            {['Features', 'Pricing', 'Testimonials'].map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-semibold text-slate-300 hover:text-white border-b border-white/[0.04] last:border-0 transition-colors"
              >
                {link}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              <Link
                to="/auth?mode=login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-bold text-center border border-white/[0.12] text-slate-200 hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-bold text-center bg-emerald-400 text-black hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20"
              >
                Start Free — No credit card
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════ HERO SUITE (CENTER ALIGNED) ══════════════════════════ */}
      <section className="relative pt-40 pb-28 px-6 z-10 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] font-bold tracking-wide uppercase">
            <Zap className="w-3 h-3 fill-current" /> Study Smarter, Save Hours
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-3xl">
            Your notes.<br />
            Organized by AI in <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">seconds.</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl font-light">
          Upload PDFs, textbooks, lecture notes, or slides. Instantly generate summaries, flashcards, quizzes, and AI-powered tutoring from your study materials.
          </p>

          <div className="pt-4 w-full sm:w-auto min-w-[240px]">
            <button onClick={() => navigate('/auth?mode=signup')} className="group w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-xs text-black bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-400/10">
              Create Free Account
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* ══════════════════════════ TRUSTED BY STRIP ══════════════════════════ */}
      <section className="relative z-10 border-y border-white/[0.06] bg-[#070b14]/70 backdrop-blur-md py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <FadeIn key={i} delay={i * 0.05} className="text-center md:text-left md:border-l md:border-white/[0.06] md:pl-6 first:border-none flex flex-col items-center md:items-start justify-center">
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-black text-white tracking-tight">{stat.value}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════ THE CORE FEATURES ══════════════════════════ */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          
          <FadeIn className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Built For Fast Learning
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything You Need to Study Smarter
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto font-light leading-relaxed">
             One platform for summarizing, practicing, revising, and learning faster.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <FadeIn key={idx} delay={idx * 0.05}>
                  <Link to="/auth?mode=signup" className="block h-full group">
                    <div className="h-full p-6 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-300 flex flex-col justify-between group-hover:-translate-y-1">
                      <div>
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${feat.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                          {feat.title}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-emerald-400" />
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed font-light">{feat.desc}</p>
                      </div>
                      <div className="mt-5 text-[10px] font-bold tracking-wider uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
                        Try Feature Free
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
          
        </div>
      </section>

      {/* ══════════════════════════ SIMPLE SYSTEM STEP ARRAY ══════════════════════════ */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.06] bg-slate-950/20">
        <div className="max-w-5xl mx-auto">
          
          <FadeIn className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <GraduationCap className="w-3 h-3" /> Three Easy Steps
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How Memora Works
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Upload ', desc: 'Drag and drop any PDFs, textbooks, lecture notes, or presentations.Everything works cleanly.', icon: FileText },
              { step: '2', title: 'Process', desc: 'AI analyzes your content and creates summaries, flashcards, quizzes, and study resources.', icon: Brain },
              { step: '3', title: 'Learn ', desc: 'Review faster, practice smarter, and track your progress from one dashboard.', icon: TrendingUp },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="relative p-6 rounded-xl border border-white/[0.06] bg-slate-900/10 backdrop-blur-sm h-full">
                    <div className="absolute top-4 right-4 text-3xl font-black text-white/[0.02] font-mono select-none">{step.step}</div>
                    <Icon className="w-5 h-5 mb-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm mb-1.5">{step.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-light">{step.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
          
        </div>
      </section>

      {/* ══════════════════════════ REVIEWS FROM REAL USERS ══════════════════════════ */}
      <section id="testimonials" className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          
          <FadeIn className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Star className="w-2.5 h-2.5 fill-amber-400" /> Real Student Reviews
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Trusted by Students Everywhere
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.01] h-full flex flex-col justify-between">
                  <div>
                    <div className="flex gap-0.5 mb-4 justify-start">
                      {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed mb-6 font-light">"{t.quote}"</p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-white/[0.04] pt-4">
                    <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{t.name}</p>
                      <p className="text-[10px] text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          
        </div>
      </section>

      {/* ══════════════════════════ SIMPLE PRICING SYSTEM ══════════════════════════ */}
      <section id="pricing" className="relative z-10 py-24 px-6 border-t border-white/[0.06] bg-slate-950/20">
        <div className="max-w-6xl mx-auto">
          
          <FadeIn className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Simple Pricing Plans
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fair plans, cancel anytime
            </h2>

            <div className="inline-flex items-center gap-1 mt-4 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {['monthly', 'annual'].map(cycle => (
                <button key={cycle} onClick={() => setBillingCycle(cycle)} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${billingCycle === cycle ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  {cycle === 'monthly' ? 'Monthly' : 'Annual (Save 20%)'}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto">
            {[
              { name: 'Starter Tier', price: billingCycle === 'monthly' ? '9' : '7', desc: 'Perfect for exploring simple AI study sets.', features: ['10 PDF uploads every month', 'AI Summary generator node', '50 smart custom flashcards'], highlight: false },
              { name: 'Scholar Pro', price: billingCycle === 'monthly' ? '19' : '15', desc: 'Unrestricted access for full-time students.', features: ['Unlimited notebook uploads', 'Deep multi-chapter analysis', 'Unlimited smart flashcards', '24/7 AI tutor chatbot connected'], highlight: true },
              { name: 'Study Groups', price: billingCycle === 'monthly' ? '49' : '39', desc: 'Integrated options for collaborative classes.', features: ['Everything included in Pro tier', 'Shared spaces for group work', 'Team activity tracking panel'], highlight: false }
            ].map((plan, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className={`relative h-full p-6 rounded-xl border flex flex-col justify-between transition-all text-left ${plan.highlight ? 'border-emerald-500 bg-emerald-500/[0.02] shadow-xl' : 'border-white/[0.06] bg-[#070a13]'}`}>
                  <div>
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-1">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400 leading-normal font-light">{plan.desc}</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-slate-500 text-xs">$</span>
                      <span className="text-4xl font-black text-white tracking-tight">{plan.price}</span>
                      <span className="text-slate-500 text-[11px]">/mo</span>
                    </div>
                    <div className="h-px bg-white/[0.06] mb-4" />
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => navigate('/auth?mode=signup')} className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all ${plan.highlight ? 'bg-emerald-400 text-black hover:bg-emerald-350 shadow-md' : 'border border-white/10 text-slate-300 hover:bg-white/5'}`}>
                    Choose Plan
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
          
        </div>
      </section>

      {/* ══════════════════════════ CONVERSION ACTION ACCORDION ══════════════════════════ */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#050913] p-10 md:p-14 text-center overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-4 flex flex-col items-center justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Start Learning Faster
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  Ready to upgrade your study workflow?
                </h2>
                <p className="text-slate-400 max-w-md mx-auto text-xs font-light leading-relaxed">
                  Join over 50,000 students using clear, structured summaries and active flashcards to lock in top scores.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
                  <button onClick={() => navigate('/auth?mode=signup')} className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs text-black bg-white hover:bg-slate-100 transition-all">
                    Get Started For Free
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <Link to="/auth?mode=login" className="text-xs text-slate-400 hover:text-white transition-colors font-medium">
                    Already have an account? Sign In
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════ SYSTEM FOOTER LINKS ══════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#02050c] py-12 px-6 text-slate-500 text-left">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-sm text-white">Memora AI</span>
              </div>
              <p className="text-xs max-w-xs leading-relaxed font-light">
                Beautiful study workspaces engineered to transform massive lecture slide files into crisp, active recall resources instantly.
              </p>
            </div>

            {[
              { title: 'Platform', links: ['Note Summarizer', 'Smart Flashcards', 'Practice Exams'] },
              { title: 'Resources', links: ['Student Guides', 'Security Specs', 'System Status'] },
              { title: 'Company', links: ['About Us', 'Privacy Policy', 'Terms of Use'] },
            ].map(col => (
              <div key={col.title} className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-xs hover:text-slate-300 transition-colors font-light">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/[0.05]" />
          <div className="flex flex-col md:flex-row items-center justify-between text-[10px] font-mono gap-2 md:gap-0">
            <p>© 2026 Memora AI Inc. All rights reserved.</p>
            <p className="text-slate-600">Built with love for high-performing students everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};