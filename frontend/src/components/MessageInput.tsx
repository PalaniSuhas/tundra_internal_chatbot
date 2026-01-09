import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={{ 
        padding: '1.25rem', 
        borderTop: '1px solid var(--bg-300)',
        background: 'var(--bg-200)'
      }}
    >
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-end' }}>
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
            padding: '0.875rem 1.125rem',
            border: '2px solid var(--bg-300)',
            borderRadius: '10px',
            fontSize: '0.95rem',
            outline: 'none',
            resize: 'none',
            minHeight: '48px',
            maxHeight: '200px',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            background: 'var(--bg-100)',
            color: 'var(--text-100)',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-100)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--bg-300)'}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            padding: '0.875rem 1.5rem',
            background: disabled || !input.trim() 
              ? 'var(--bg-300)' 
              : `linear-gradient(135deg, var(--primary-200) 0%, var(--accent-100) 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            height: '48px',
            transition: 'all 0.2s ease',
            fontWeight: 600
          }}
          onMouseEnter={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && input.trim()) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <Send size={20} />
          Send
        </button>
      </div>
      <div style={{ 
        marginTop: '0.625rem', 
        fontSize: '0.75rem', 
        color: 'var(--text-200)',
        textAlign: 'right'
      }}>
        Press Enter to send • Shift+Enter for new line
      </div>
    </form>
  );
};