import React, { forwardRef } from 'react';
import { Send } from 'lucide-react';

const InputBar = forwardRef<HTMLDivElement>(({ onClick }, ref) => {
  return (
    <div ref={ref} className="input-bar" onClick={onClick}>
      <span className="input-text">Tap to answer…</span>
      <Send className="send-icon" />
    </div>
  );
});

InputBar.displayName = 'InputBar';

export default InputBar;