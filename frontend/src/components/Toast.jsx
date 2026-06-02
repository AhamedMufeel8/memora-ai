import { AnimatePresence, motion } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useStudy();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'info': return <Info className="w-5 h-5 text-sky-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success': return 'border-emerald-500/25';
      case 'info': return 'border-sky-500/25';
      case 'warning': return 'border-amber-500/25';
      case 'error': return 'border-rose-500/25';
      default: return 'border-indigo-500/25';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-panel bg-white/80 dark:bg-slate-900/80 shadow-lg ${getBorderColor(toast.type)}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
