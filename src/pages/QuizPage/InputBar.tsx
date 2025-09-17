import React, { forwardRef, useState } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface InputBarProps {
  onClick?: (e: React.MouseEvent) => void;
  showModal?: boolean;
}

const InputBar = forwardRef<HTMLDivElement, InputBarProps>(({ onClick, showModal }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    setIsFocused(true);
    if (onClick) onClick(e);
  };

  const handleSendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
  };

  return (
    <motion.div
      className="bg-white border-t border-gray-200 px-4 py-3"
      animate={{
        y: showModal ? 100 : 0, // Move down and out of view when modal is shown
        opacity: showModal ? 0 : 1 // Fade out when modal is shown
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        visibility: showModal ? 'hidden' : 'visible'
      }}
    >
      <div className="flex items-center space-x-3">
        {/* Input field */}
        <div
          ref={ref}
          className={`flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-3 cursor-pointer transition-all duration-200 ${
            isFocused ? 'bg-white border-2 border-blue-500' : 'hover:bg-gray-150'
          }`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Open answer options"
        >
          <span className="text-gray-500 flex-1">Tap to answer</span>
          <button
            className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
            onClick={handleSendClick}
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

InputBar.displayName = 'InputBar';

export default InputBar;