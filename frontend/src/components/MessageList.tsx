import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';
import { User, Bot, Copy, Check, RotateCcw } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  onResendMessage?: (content: string) => void;
}

// Enhanced markdown formatter with line-by-line code streaming
const formatText = (text: string, isStreaming: boolean = false): JSX.Element[] => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  lines.forEach((line, lineIndex) => {
    // Check for code block markers
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <CodeBlock 
            key={`code-${lineIndex}`}
            code={codeBlockContent.join('\n')}
            language={codeBlockLang}
            isStreaming={isStreaming}
          />
        );
        codeBlockContent = [];
        codeBlockLang = '';
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      // For streaming code blocks, show partial content
      if (isStreaming && lineIndex === lines.length - 1) {
        elements.push(
          <CodeBlock 
            key={`code-streaming-${lineIndex}`}
            code={codeBlockContent.join('\n')}
            language={codeBlockLang}
            isStreaming={true}
          />
        );
      }
      return;
    }

    // Process inline formatting
    const processFormatting = (text: string): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      let currentIndex = 0;
      let keyCounter = 0;

      const formatRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
      let match;

      while ((match = formatRegex.exec(text)) !== null) {
        if (match.index > currentIndex) {
          result.push(text.slice(currentIndex, match.index));
        }

        if (match[1]) {
          result.push(
            <strong key={`bold-${lineIndex}-${keyCounter++}`} style={{ fontWeight: 700, color: 'var(--text-100)' }}>
              {match[2]}
            </strong>
          );
        } else if (match[3]) {
          result.push(
            <em key={`italic-${lineIndex}-${keyCounter++}`} style={{ fontStyle: 'italic' }}>
              {match[4]}
            </em>
          );
        } else if (match[5]) {
          result.push(
            <code 
              key={`code-${lineIndex}-${keyCounter++}`}
              style={{
                background: 'var(--bg-300)',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
                color: 'var(--accent-200)'
              }}
            >
              {match[6]}
            </code>
          );
        }

        currentIndex = match.index + match[0].length;
      }

      if (currentIndex < text.length) {
        result.push(text.slice(currentIndex));
      }

      return result.length > 0 ? result : [text];
    };

    // Headers
    if (line.trim().startsWith('#')) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
        elements.push(
          <HeaderTag 
            key={`header-${lineIndex}`}
            style={{
              marginTop: level === 1 ? '1.25rem' : '1rem',
              marginBottom: '0.5rem',
              fontWeight: 700,
              fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1.1rem',
              color: 'var(--text-100)'
            }}
          >
            {processFormatting(text)}
          </HeaderTag>
        );
        return;
      }
    }

    // Bullet points
    if (line.trim().match(/^[-*+]\s+/)) {
      const text = line.trim().replace(/^[-*+]\s+/, '');
      elements.push(
        <div key={`bullet-${lineIndex}`} style={{ 
          marginLeft: '1.5rem',
          marginBottom: '0.375rem',
          color: 'var(--text-100)',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <span style={{ color: 'var(--accent-100)', flexShrink: 0 }}>•</span>
          <span>{processFormatting(text)}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    if (line.trim().match(/^\d+\.\s+/)) {
      const match = line.trim().match(/^(\d+)\.\s+(.+)$/);
      if (match) {
        elements.push(
          <div key={`numbered-${lineIndex}`} style={{ 
            marginLeft: '1.5rem',
            marginBottom: '0.375rem',
            color: 'var(--text-100)',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--accent-100)', fontWeight: 600, flexShrink: 0 }}>{match[1]}.</span>
            <span>{processFormatting(match[2])}</span>
          </div>
        );
        return;
      }
    }

    // Regular line
    const processedContent = processFormatting(line);
    if (processedContent.length > 0 || line.trim() === '') {
      elements.push(
        <div key={`line-${lineIndex}`} style={{ 
          marginBottom: line.trim() === '' ? '0.5rem' : '0',
          color: 'var(--text-100)'
        }}>
          {processedContent.length > 0 ? processedContent : <br />}
        </div>
      );
    }
  });

  return elements;
};

// Code Block Component with Copy functionality
const CodeBlock: React.FC<{ code: string; language: string; isStreaming?: boolean }> = ({ 
  code, 
  language, 
  isStreaming = false 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--bg-300)',
      color: 'var(--text-100)',
      borderRadius: '8px',
      marginTop: '0.75rem',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      border: '1px solid var(--bg-300)',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid var(--bg-300)'
      }}>
        {language && (
          <div style={{ 
            color: 'var(--text-200)', 
            fontSize: '0.8rem', 
            fontWeight: 600,
            textTransform: 'lowercase'
          }}>
            {language}
          </div>
        )}
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : 'var(--text-200)',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre style={{ 
        margin: 0, 
        padding: '1rem',
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word',
        overflow: 'auto'
      }}>
        <code>{code}</code>
        {isStreaming && (
          <span style={{ 
            animation: 'pulse 1.5s infinite',
            marginLeft: '2px',
            color: 'var(--accent-100)'
          }}>▊</span>
        )}
      </pre>
    </div>
  );
};

// Message Component with Actions
const MessageBubble: React.FC<{
  message: Message;
  onCopy?: () => void;
  onRedo?: () => void;
}> = ({ message, onCopy, onRedo }) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.25rem',
        background: 'var(--bg-200)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--bg-300)',
        position: 'relative'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: message.role === 'user' 
          ? `linear-gradient(135deg, var(--primary-200) 0%, var(--accent-100) 100%)` 
          : `linear-gradient(135deg, var(--accent-100) 0%, var(--accent-200) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {message.role === 'user' ? <User size={22} color="white" /> : <Bot size={22} color="white" />}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: '0.625rem',
          color: 'var(--text-100)',
          fontSize: '0.95rem'
        }}>
          {message.role === 'user' ? 'You' : 'Assistant'}
        </div>
        <div style={{ 
          lineHeight: '1.7',
          color: 'var(--text-100)',
          fontSize: '0.95rem'
        }}>
          {formatText(message.content, false)}
        </div>
        {message.file_references && message.file_references.length > 0 && (
          <div style={{ 
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-200)',
            fontStyle: 'italic'
          }}>
            📎 Referenced: {message.file_references.join(', ')}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          right: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          background: 'var(--bg-100)',
          padding: '0.375rem',
          borderRadius: '8px',
          border: '1px solid var(--bg-300)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? '#10b981' : 'var(--text-200)',
              cursor: 'pointer',
              padding: '0.375rem 0.5rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!copied) e.currentTarget.style.background = 'var(--bg-300)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          {message.role === 'user' && onRedo && (
            <button
              onClick={onRedo}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-200)',
                cursor: 'pointer',
                padding: '0.375rem 0.5rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-300)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, streamingContent, onResendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '1.5rem',
      background: 'var(--bg-100)'
    }}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onRedo={message.role === 'user' && onResendMessage ? () => onResendMessage(message.content) : undefined}
        />
      ))}
      
      {streamingContent && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1.25rem',
            background: 'var(--bg-200)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--bg-300)'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, var(--accent-100) 0%, var(--accent-200) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bot size={22} color="white" />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '0.625rem',
              color: 'var(--text-100)',
              fontSize: '0.95rem'
            }}>
              Assistant
            </div>
            <div style={{ 
              lineHeight: '1.7',
              color: 'var(--text-100)',
              fontSize: '0.95rem'
            }}>
              {formatText(streamingContent, true)}
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};