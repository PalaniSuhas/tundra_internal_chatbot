import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
}

// Enhanced markdown formatter
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
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '1rem',
            borderRadius: '6px',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            {codeBlockLang && (
              <div style={{ 
                color: '#888', 
                fontSize: '0.8rem', 
                marginBottom: '0.5rem' 
              }}>
                {codeBlockLang}
              </div>
            )}
            <pre style={{ margin: 0 }}>
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

    // Process inline formatting - need to handle bold/italic carefully
    let processedContent: (string | JSX.Element)[] = [line];
    let keyCounter = 0;

    // Process bold first: **text** or __text__
    const processBold = (parts: (string | JSX.Element)[]): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      
      parts.forEach((part, partIdx) => {
        if (typeof part === 'string') {
          const boldRegex = /(\*\*|__)((?:(?!\1).)+)\1/g;
          let lastIndex = 0;
          let match;
          
          while ((match = boldRegex.exec(part)) !== null) {
            if (match.index > lastIndex) {
              result.push(part.slice(lastIndex, match.index));
            }
            result.push(
              <strong key={`bold-${lineIndex}-${partIdx}-${keyCounter++}`}>
                {match[2]}
              </strong>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < part.length) {
            result.push(part.slice(lastIndex));
          }
        } else {
          result.push(part);
        }
      });
      
      return result;
    };

    // Process italic: *text* or _text_ (but not ** or __)
    const processItalic = (parts: (string | JSX.Element)[]): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      
      parts.forEach((part, partIdx) => {
        if (typeof part === 'string') {
          const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
          let lastIndex = 0;
          let match;
          
          while ((match = italicRegex.exec(part)) !== null) {
            if (match.index > lastIndex) {
              result.push(part.slice(lastIndex, match.index));
            }
            result.push(
              <em key={`italic-${lineIndex}-${partIdx}-${keyCounter++}`}>
                {match[1] || match[2]}
              </em>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < part.length) {
            result.push(part.slice(lastIndex));
          }
        } else {
          result.push(part);
        }
      });
      
      return result;
    };

    // Process inline code: `code`
    const processInlineCode = (parts: (string | JSX.Element)[]): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      
      parts.forEach((part, partIdx) => {
        if (typeof part === 'string') {
          const codeRegex = /`([^`]+)`/g;
          let lastIndex = 0;
          let match;
          
          while ((match = codeRegex.exec(part)) !== null) {
            if (match.index > lastIndex) {
              result.push(part.slice(lastIndex, match.index));
            }
            result.push(
              <code 
                key={`code-${lineIndex}-${partIdx}-${keyCounter++}`}
                style={{
                  background: '#f3f4f6',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  color: '#e53e3e'
                }}
              >
                {match[1]}
              </code>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < part.length) {
            result.push(part.slice(lastIndex));
          }
        } else {
          result.push(part);
        }
      });
      
      return result;
    };

    // Apply formatting in order: bold -> italic -> inline code
    processedContent = processBold(processedContent);
    processedContent = processItalic(processedContent);
    processedContent = processInlineCode(processedContent);

    // Check for headers
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
              marginTop: level === 1 ? '1rem' : '0.75rem',
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1.1rem'
            }}
          >
            {text}
          </HeaderTag>
        );
        return;
      }
    }

    // Check for bullet points
    if (line.trim().match(/^[-*+]\s+/)) {
      const text = line.trim().replace(/^[-*+]\s+/, '');
      elements.push(
        <div key={`bullet-${lineIndex}`} style={{ 
          marginLeft: '1.5rem',
          marginBottom: '0.25rem'
        }}>
          <span style={{ marginRight: '0.5rem' }}>•</span>
          {text}
        </div>
      );
      return;
    }

    // Check for numbered lists
    if (line.trim().match(/^\d+\.\s+/)) {
      const match = line.trim().match(/^(\d+)\.\s+(.+)$/);
      if (match) {
        elements.push(
          <div key={`numbered-${lineIndex}`} style={{ 
            marginLeft: '1.5rem',
            marginBottom: '0.25rem'
          }}>
            <span style={{ marginRight: '0.5rem' }}>{match[1]}.</span>
            {match[2]}
          </div>
        );
        return;
      }
    }

    // Regular line
    if (processedContent.length > 0 || line.trim() === '') {
      elements.push(
        <div key={`line-${lineIndex}`} style={{ marginBottom: line.trim() === '' ? '0.5rem' : '0' }}>
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
      padding: '1rem',
      background: '#f9fafb'
    }}>
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: message.role === 'user' ? '#667eea' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {message.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="white" />}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div style={{ 
              lineHeight: '1.6',
              color: '#555'
            }}>
              {formatText(message.content)}
            </div>
            {message.file_references && message.file_references.length > 0 && (
              <div style={{ 
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: '#999'
              }}>
                Referenced files: {message.file_references.join(', ')}
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
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bot size={20} color="white" />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              Assistant
            </div>
            <div style={{ 
              lineHeight: '1.6',
              color: '#555'
            }}>
              {formatText(streamingContent)}
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};