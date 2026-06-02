import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Sparkles,
  ChevronRight,
  Star,
  Play,
  Volume2,
  Award,
  FileText,
  ArrowRight,
  BookOpen,
  MessageSquare
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
export const Landing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  const pricingPlans = [
    {
      name: 'Starter Space',
      price: billingCycle === 'monthly' ? '$9' : '$7',
      desc: 'Perfect for individual students seeking to automate summaries and cards.',
      features: [
        '10 PDF uploads / mo',
        'AI Summary Generator',
        '50 AI Flashcards generated',
        'Standard AI Smart Quizzes',
        'Email Support'
      ],
      popular: false,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      name: 'Scholar Pro',
      price: billingCycle === 'monthly' ? '$19' : '$15',
      desc: 'Advanced plan for high-performing students wanting full audio & chat power.',
      features: [
        'Unlimited PDF uploads',
        'Deep AI Chapter Analysis',
        'Unlimited AI Flashcards',
        'AI Chat Tutor context (Custom books)',
        'Podcast Audio Lesson synthesis',
        'Priority beta models access'
      ],
      popular: true,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      name: 'Classmate Team',
      price: billingCycle === 'monthly' ? '$49' : '$39',
      desc: 'Collaborative spaces for institutions, study groups, and tuition classes.',
      features: [
        'Everything in Scholar Pro',
        'Shared study lobbies',
        'Custom teacher metrics dashboard',
        'API endpoint integrations',
        'Dedicated 24/7 Slack support'
      ],
      popular: false,
      color: 'from-purple-600 to-cyan-500'
    }
  ];

  const features = [
    {
      icon: FileText,
      title: 'AI Note Summarizer',
      desc: 'Drag & drop heavy textbook PDFs and receive detailed, structured notes in seconds with key definitions highlighted.',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    },
    {
      icon: Sparkles,
      title: 'AI Flashcards Deck',
      desc: 'Let our AI construct study cards automatically from your uploaded notes. Practice with 3D flip card dynamics.',
      color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    },
    {
      icon: Award,
      title: 'Smart MCQ Quizzes',
      desc: 'Verify understanding with custom Multiple-Choice and True/False assessments matched with timer feedback systems.',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    },
    {
      icon: MessageSquare,
      title: '24/7 AI Expert Chat',
      desc: 'Engage with a dedicated ChatGPT-inspired subject matter coach. Reference books directly for precise tutor answers.',
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    },
    {
      icon: Volume2,
      title: 'AI Audio Lessons',
      desc: 'Convert study materials into high-fidelity custom podcasts. Control speed and read transcripts simultaneously.',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      icon: BookOpen,
      title: 'Integrated Book Library',
      desc: 'Build your reading bookshelf. Use bookmarks, query text, track reading stats, and continue where you left off.',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
  ];

  return (
    <div className="bg-[#0b0f19] text-slate-100 font-sans min-h-screen overflow-x-hidden selection:bg-indigo-500/30">
      {/* Glow Orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-indigo-600/10 top-[-100px] left-[-100px]" />
      <div className="glow-orb w-[600px] h-[600px] bg-cyan-600/10 right-[-100px] top-[20%]" />
      <div className="glow-orb w-[500px] h-[500px] bg-purple-600/10 bottom-[10%] left-[20%]" />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div >
              <img src='./logo.png' alt="Logo" style={{ width: '200px', marginRight: '20px' }} />
              
            </div>
            {/* <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
              AI Study Platform
            </span> */}
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-cyan-400 text-white hover:shadow-neon-indigo transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">Unveiling the future of learning</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
           Welcome to Memora Ai: Your Ultimate AI-Powered Study Companion 
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
           Upload notes, generate summaries, create flashcards, take quizzes, and learn with your personal AI tutor — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white flex items-center justify-center gap-2 hover:shadow-neon-indigo transition-all duration-300"
            >
             Start Learning Free
              <ChevronRight className="w-5 h-5" />
            </button>
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-200" />
              Watch Demo video
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 border-t border-slate-900 bg-[#080d19]/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need To Study Smarter</h2>
            <p className="text-slate-400">From understanding concepts to preparing for exams, Memora AI helps you learn more effectively.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map((feat, idx) => {
    const Icon = feat.icon;

    return (
      <Link
        key={idx}
        to="/auth?mode=signup"
        className="block"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          whileHover={{ y: -6 }}
          className="h-full p-8 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md hover:border-indigo-500/40 transition-all group duration-300 cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${feat.color}`}>
            <Icon className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
            {feat.title}
          </h3>

          <p className="text-slate-400 text-sm leading-relaxed">
            {feat.desc}
          </p>
        </motion.div>
      </Link>
    );
  })}
</div>
        </div>
        
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted By Students Worldwide</h2>
            <p className="text-slate-400">See how students are improving their learning with Memora AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
              <div className="flex gap-1 text-amber-400 mb-4">
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                "The PDF summarizer saved me during final exams. I dropped my 60-page biology slide decks, and it created complete outlines and corresponding quizzes instantly!"
              </p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&h=128&fit=crop" alt="Sarah" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-white">Sarah Jenkins</h4>
                  <p className="text-xs text-slate-500">Pre-Med Undergrad</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
              <div className="flex gap-1 text-amber-400 mb-4">
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                "Converting my study notes to audio lesson podcasts is a game changer. I listen to them on my morning train ride and use the interactive flashcard deck on the way back."
              </p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&h=128&fit=crop" alt="Marcus" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-white">Marcus Vance</h4>
                  <p className="text-xs text-slate-500">Computer Science Sophomore</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
              <div className="flex gap-1 text-amber-400 mb-4">
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                "Having an AI Tutor linked directly to my textbooks is incredible. I can click any difficult page and immediately prompt a customized chat explaining the details."
              </p>
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&h=128&fit=crop" alt="Elena" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-white">Elena Rostova</h4>
                  <p className="text-xs text-slate-500">Postgrad Researcher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 border-t border-slate-900 bg-[#080d19]/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Transparent Pricing Plan</h2>
            <p className="text-slate-400">Unlock complete access with simple subscription schemes. No setup fees or surprise additions.</p>

            {/* Toggle Switch */}
            <div className="inline-flex items-center gap-3 mt-8 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400'}`}
              >
                Monthly billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${billingCycle === 'annual' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400'}`}
              >
                Annual billing (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-2xl border flex flex-col justify-between relative transition-all duration-300 ${plan.popular
                    ? 'border-indigo-500 bg-gradient-to-b from-indigo-900/20 to-slate-900/50 shadow-neon-indigo scale-105 z-10'
                    : 'border-slate-800/80 bg-slate-900/40'
                  }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">/ month</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6">{plan.desc}</p>
                  <div className="w-full h-px bg-slate-800 mb-6" />
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/auth?mode=signup')}
                  className={`w-full py-3 rounded-xl font-semibold text-xs tracking-wide transition-all ${plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-md'
                      : 'border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  Join {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-6 text-center relative border-t border-slate-900">
        <div className="max-w-4xl mx-auto rounded-3xl border border-indigo-500/25 bg-gradient-to-tr from-[#080d19] via-slate-900/60 to-indigo-950/20 p-12 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Ace Your Next Assessment?</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mb-10">
            Join thousands of active students using our SaaS AI tool to process PDF textbooks, master custom flashcards, and interact with AI experts.
          </p>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="px-8 py-4 rounded-xl font-bold bg-white text-slate-905 bg-gradient-to-r from-white to-slate-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-900 inline-flex items-center gap-2"
          >
            Create Your Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#070b13] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="font-bold text-white">AI Study Platform</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
             AI-powered learning tools designed to help students study smarter and achieve better results.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Core Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li><Link to="/auth?mode=login" className="hover:text-white transition-colors">AI Summarizer</Link></li>
              <li><Link to="/auth?mode=login" className="hover:text-white transition-colors">Study Cards Deck</Link></li>
              <li><Link to="/auth?mode=login" className="hover:text-white transition-colors">Smart Quiz panel</Link></li>
              <li><Link to="/auth?mode=login" className="hover:text-white transition-colors">Speech Synthesizer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Student Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer API docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sample Textbook Library</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security Safeguards</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Active Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Principles</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto h-px bg-slate-900 my-8" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-600">
          <p>© 2026 AI Study Platform Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400">Twitter</a>
            <a href="#" className="hover:text-slate-400">LinkedIn</a>
            <a href="#" className="hover:text-slate-400">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
