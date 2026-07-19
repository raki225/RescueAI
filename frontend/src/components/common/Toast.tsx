import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RotateCw, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  variant?: 'error' | 'info';
}

/** Floating, dismissible toast used for load/network errors. */
export const Toast = ({ message, onRetry, onDismiss, variant = 'error' }: ToastProps) => {
  const isError = variant === 'error';
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="fixed left-1/2 top-20 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0"
      >
        <div
          className="flex items-start gap-3 rounded-[18px] border bg-white/95 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur"
          style={{ borderColor: isError ? 'rgba(229,57,53,0.25)' : '#E8EDF5' }}
        >
          <span
            className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${
              isError ? 'bg-[#E53935]/10 text-[#E53935]' : 'bg-[#0F3DDE]/10 text-[#0F3DDE]'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary">
              {isError ? 'Unable to load hospitals' : 'Notice'}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">{message}</p>
            <div className="mt-2.5 flex items-center gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0F3DDE] to-secondary px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-105"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Retry
                </button>
              )}
              <button
                onClick={onDismiss}
                className="focus-ring rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-slate-100 hover:text-primary"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="focus-ring -mr-1 -mt-1 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;
