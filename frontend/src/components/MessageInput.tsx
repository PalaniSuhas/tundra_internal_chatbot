import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={{ 
        padding: '1rem', 
        borderTop: '1px solid #e5e7eb',
        background: 'white'
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
            outline: 'none',
            resize: 'none',
            minHeight: '44px',
            maxHeight: '200px',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: disabled || !input.trim() ? '#d1d5db' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            height: '44px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.background = '#5568d3';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.background = '#667eea';
            }
          }}
        >
          <Send size={20} />
          Send
        </button>
      </div>
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.75rem', 
        color: '#9ca3af',
        textAlign: 'right'
      }}>
        Press Enter to send • Shift+Enter for new line
      </div>
    </form>
  );
};