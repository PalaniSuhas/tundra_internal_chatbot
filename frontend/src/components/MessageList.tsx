import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
}

// Enhanced markdown formatter with fixed bold rendering
const formatText = (text: string): JSX.Element[] => {
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
          <div key={`code-${lineIndex}`} style={{
            background: 'var(--bg-300)',
            color: 'var(--text-100)',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '0.75rem',
            marginBottom: '0.75rem',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            border: '1px solid var(--bg-300)'
          }}>
            {codeBlockLang && (
              <div style={{ 
                color: 'var(--text-200)', 
                fontSize: '0.8rem', 
                marginBottom: '0.5rem',
                fontWeight: 600
              }}>
                {codeBlockLang}
              </div>
            )}
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {codeBlockContent.join('\n')}
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = '';
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Process inline formatting
    const processFormatting = (text: string): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      let currentIndex = 0;
      let keyCounter = 0;

      // Combined regex for bold (**text**), italic (*text*), and inline code (`text`)
      const formatRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
      let match;

      while ((match = formatRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > currentIndex) {
          result.push(text.slice(currentIndex, match.index));
        }

        if (match[1]) {
          // Bold: **text**
          result.push(
            <strong key={`bold-${lineIndex}-${keyCounter++}`} style={{ fontWeight: 700, color: 'var(--text-100)' }}>
              {match[2]}
            </strong>
          );
        } else if (match[3]) {
          // Italic: *text*
          result.push(
            <em key={`italic-${lineIndex}-${keyCounter++}`} style={{ fontStyle: 'italic' }}>
              {match[4]}
            </em>
          );
        } else if (match[5]) {
          // Inline code: `text`
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

      // Add remaining text
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

export const MessageList: React.FC<MessageListProps> = ({ messages, streamingContent }) => {
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
        <div
          key={message.id}
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
              {formatText(message.content)}
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
        </div>
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
              {formatText(streamingContent)}
              <span style={{ 
                animation: 'pulse 1.5s infinite',
                marginLeft: '2px',
                color: 'var(--accent-100)'
              }}>▊</span>
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