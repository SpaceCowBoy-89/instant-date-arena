import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progress = (current / total) * 100;

  return (
    <div className="progress-bar-container">
      <motion.div
        className="progress-bar-fill"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, duration: 0.5 }}
        aria-label={`Progress: ${Math.round(progress)}% complete`}
      >
        {progress === 100 && (
          <Heart
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[#be185d]"
            aria-hidden="true"
          />
        )}
      </motion.div>
      <span className="sr-only">{`Progress: ${Math.round(progress)}% complete`}</span>
    </div>
  );
};

export default ProgressBar;