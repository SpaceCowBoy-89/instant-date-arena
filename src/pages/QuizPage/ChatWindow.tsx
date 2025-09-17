import { useEffect } from 'react';
import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: { role: 'ai' | 'user'; text: string }[];
  isTyping: boolean;
  chatRef: React.RefObject<HTMLDivElement>;
}

const ChatWindow = ({ messages, isTyping, chatRef }: ChatWindowProps) => {
  // Force scroll to bottom whenever messages change
  useEffect(() => {
    if (chatRef.current) {
      const element = chatRef.current;

      const scrollToBottom = () => {
        element.scrollTop = element.scrollHeight;
      };

      // Multiple scroll attempts with different timing
      const timeouts = [
        setTimeout(scrollToBottom, 0),
        setTimeout(scrollToBottom, 50),
        setTimeout(scrollToBottom, 150),
        setTimeout(scrollToBottom, 300)
      ];

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [messages, isTyping, chatRef]);

  return (
    <div
      ref={chatRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 space-y-2"
      style={{
        paddingTop: 'calc(110px + env(safe-area-inset-top))', // Account for fixed header + larger avatar + safe area
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', // Account for fixed input bar + safe area
        scrollBehavior: 'smooth',
        height: '100vh', // Ensure proper height
        overflowAnchor: 'none' // Prevent scroll anchoring issues
      }}
    >
      {messages.map((m, i) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isLastUserMessage = m.role === 'user' && i === messages.length - 1;
        return (
          <ChatBubble
            key={i}
            role={m.role}
            text={m.text}
            timestamp={timestamp}
            delivered={m.role === 'user'}
            showDelivered={isLastUserMessage}
          />
        );
      })}
      {isTyping && <ChatBubble role="typing" />}
    </div>
  );
};

export default ChatWindow;