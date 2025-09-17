import React from 'react';
import { motion } from 'framer-motion';

export interface ChatBubbleProps {
  role: 'ai' | 'user' | 'typing';
  text?: string;
  timestamp?: string;
  delivered?: boolean;
  showDelivered?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text, timestamp, delivered, showDelivered }) => {
  const isTyping = role === 'typing';
  const isUser = role === 'user';
  const isAI = role === 'ai';

  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="flex items-end space-x-2 mb-4"
      >
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
          <img
            src="/src/assets/quiz-bot-avatar.svg"
            alt="AI"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-end space-x-2 max-w-[75%] sm:max-w-sm md:max-w-md lg:max-w-lg ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {isAI && (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            <img
              src="/src/assets/quiz-bot-avatar.svg"
              alt="AI"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col">
          <div
            className={`px-4 py-2 rounded-2xl relative ${
              isUser
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}
            style={{
              wordBreak: 'break-word'
            }}
          >
            {/* Chat bubble tail */}
            <div
              className={`absolute bottom-0 w-3 h-3 ${
                isUser
                  ? 'right-0 transform translate-x-1/2 bg-blue-500'
                  : 'left-0 transform -translate-x-1/2 bg-gray-100'
              }`}
              style={{
                clipPath: isUser
                  ? 'polygon(0 0, 100% 0, 0 100%)'
                  : 'polygon(100% 0, 100% 100%, 0 0)'
              }}
            />
            <p className="text-sm leading-5">{text}</p>
          </div>

          {/* Timestamp and delivery status */}
          <div className={`flex items-center mt-1 space-x-1 text-xs text-gray-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {timestamp && <span>{timestamp}</span>}
            {delivered && showDelivered && (
              <span className="text-blue-500 font-medium">Delivered</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;