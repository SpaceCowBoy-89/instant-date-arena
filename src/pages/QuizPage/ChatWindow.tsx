import { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: { role: 'ai' | 'user'; text: string }[];
  isTyping: boolean;
  chatRef: React.RefObject<HTMLDivElement>;
}

const ChatWindow = ({ messages, isTyping, chatRef }: ChatWindowProps) => {
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Force scroll to bottom whenever messages change
  useEffect(() => {
    if (chatRef.current) {
      const element = chatRef.current;

      const scrollToBottom = () => {
        // Use scrollTop for immediate scroll
        element.scrollTop = element.scrollHeight;

        // Additional attempt with requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
        });
      };

      // Multiple scroll attempts with different timing
      const timeouts = [
        setTimeout(scrollToBottom, 0),
        setTimeout(scrollToBottom, 50),
        setTimeout(scrollToBottom, 150),
        setTimeout(scrollToBottom, 300),
        setTimeout(scrollToBottom, 500)
      ];

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [messages, isTyping, chatRef]);

  // Alternative scroll method using scrollIntoView on last message
  useEffect(() => {
    if (lastMessageRef.current && messages.length > 0) {
      const scrollToLastMessage = () => {
        lastMessageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      };

      // Delayed scroll to ensure DOM is updated
      const timeoutId = setTimeout(scrollToLastMessage, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  return (
    <div
      ref={chatRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 space-y-2"
      style={{
        paddingTop: 'calc(110px + env(safe-area-inset-top))', // Account for fixed header + larger avatar + safe area
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom))', // Account for fixed input bar + safe area + extra margin
        scrollBehavior: 'smooth',
        height: '100dvh', // Use dynamic viewport height for mobile
        minHeight: 'calc(100vh - 110px)', // Fallback with header space
        overflowAnchor: 'none', // Prevent scroll anchoring issues
        overscrollBehavior: 'none' // Prevent overscroll on iOS
      }}
    >
      {messages.map((m, i) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isLastUserMessage = m.role === 'user' && i === messages.length - 1;
        const isLastMessage = i === messages.length - 1;
        return (
          <div key={i} ref={isLastMessage ? lastMessageRef : null}>
            <ChatBubble
              role={m.role}
              text={m.text}
              timestamp={timestamp}
              delivered={m.role === 'user'}
              showDelivered={isLastUserMessage}
            />
          </div>
        );
      })}
      {isTyping && (
        <div ref={lastMessageRef}>
          <ChatBubble role="typing" />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;