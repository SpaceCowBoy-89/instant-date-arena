import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: string; // e.g., 'h-12 w-12', 'h-8 w-8'
  className?: string;
  isButtonSpinner?: boolean; // For button-level spinners without container
  message?: string; // Custom loading message
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'h-12 w-12',
  className = '',
  isButtonSpinner = false,
  message = 'Loading...'
}) => {
  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className="inline-block"
      >
        <Sparkles className={`text-[hsl(var(--romance))] ${size} ${className}`} />
      </motion.div>
    </motion.div>
  );

  if (isButtonSpinner) {
    return spinner;
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-[hsl(var(--background))] z-50"
      aria-busy="true"
      aria-label="Loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-4 px-4">
        <div className="flex justify-center">
          {spinner}
        </div>
        <motion.p
          className="text-[hsl(var(--muted-foreground))] text-sm max-w-xs mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Spinner;