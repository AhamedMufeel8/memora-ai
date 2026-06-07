import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  FileText,  
  Award,
  Volume2
} from 'lucide-react';

export const Onboarding = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to AI Study Platform!",
      desc: "Your interactive AI assistant dashboard is prepared. Let's look over your learning widgets quickly.",
      icon: Sparkles,
      color: "text-indigo-500 bg-indigo-500/10"
    }
  ];

  const activeStep = steps[step];

  const handleNext = () => {
    if (step + 1 < steps.length) {
      setStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const Icon = activeStep?.icon;

  return (
    <AnimatePresence>
      {isOpen && activeStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          {/* Tutorial Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-md border border-indigo-500/25 bg-slate-900 text-white rounded-3xl shadow-neon-indigo overflow-hidden p-8 z-10 text-center font-sans"
          >
            {/* Steps indicator dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === step ? 'bg-indigo-500' : 'bg-slate-750'
                  }`}
                />
              ))}
            </div>

            {/* Step Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${activeStep.color}`}>
              <Icon className="w-8 h-8" />
            </div>

            {/* Step Texts */}
            <h3 className="text-lg font-bold text-white mb-2 leading-relaxed">
              {activeStep.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mb-8">
              {activeStep.desc}
            </p>

            {/* Control buttons */}
            <div className="flex gap-3 justify-center items-center">
              {step > 0 && (
                <button
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 text-xs font-semibold"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white flex items-center justify-center gap-1.5 shadow"
              >
                {step + 1 === steps.length ? 'Start Learning' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
