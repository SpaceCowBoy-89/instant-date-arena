import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react'; // Ensure this import is present

export interface ChatBubbleProps {
  role: 'ai' | 'user' | 'typing';
  text?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text }) => {
  const isTyping = role === 'typing';
  const [showFallback, setShowFallback] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className={`chat-bubble ${role}`}
    >
      {role !== 'user' && (
        <div className="avatar-container">
          {!showFallback ? (
            <img
              src="/assets/CaptainCorazon.svg"
              alt="Captain Corazón Avatar"
              className="avatar"
              onError={() => setShowFallback(true)}
            />
          ) : (
            <Bot className="avatar" />
          )}
        </div>
      )}

      {isTyping ? (
        <div className="typing-indicator">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      ) : (
        <div className="message-text">{text}</div>
      )}
    </motion.div>
  );
};

export default ChatBubble;