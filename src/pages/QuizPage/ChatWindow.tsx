import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: { role: 'ai' | 'user'; text: string }[];
  isTyping: boolean;
  chatRef: React.RefObject<HTMLDivElement>;
}

const ChatWindow = ({ messages, isTyping, chatRef }: ChatWindowProps) => {
  return (
    <div
      ref={chatRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 space-y-2 scroll-smooth"
      style={{
        paddingTop: 'calc(110px + env(safe-area-inset-top))', // Account for fixed header + larger avatar + safe area
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', // Account for fixed input bar + safe area
        scrollBehavior: 'smooth'
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