import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: { role: 'ai' | 'user'; text: string }[];
  isTyping: boolean;
  chatRef: React.RefObject<HTMLDivElement>;
}

const ChatWindow = ({ messages, isTyping, chatRef }: ChatWindowProps) => {
  return (
    <div ref={chatRef} className="chat-window flex-1 overflow-y-auto">
      {messages.map((m, i) => (
        <ChatBubble key={i} role={m.role} text={m.text} />
      ))}
      {isTyping && <ChatBubble role="typing" />}
    </div>
  );
};

export default ChatWindow;