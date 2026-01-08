import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
}

// Simple markdown-like formatter
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
        // Starting a code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockContent = [];
      } else {
        // Ending a code block
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

    // Process inline formatting
    let processedLine = line;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Bold: **text** or __text__
    const boldRegex = /(\*\*|__)(.*?)\1/g;
    let match;
    
    while ((match = boldRegex.exec(processedLine)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(processedLine.slice(lastIndex, match.index));
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${lineIndex}-${keyCounter++}`}>
          {match[2]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < processedLine.length) {
      parts.push(processedLine.slice(lastIndex));
    }

    // Reset for italic processing
    const tempParts = [...parts];
    parts.length = 0;
    lastIndex = 0;

    tempParts.forEach((part, partIdx) => {
      if (typeof part === 'string') {
        // Italic: *text* or _text_ (but not ** or __)
        const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
        let italicMatch;
        let partLastIndex = 0;
        
        while ((italicMatch = italicRegex.exec(part)) !== null) {
          if (italicMatch.index > partLastIndex) {
            parts.push(part.slice(partLastIndex, italicMatch.index));
          }
          parts.push(
            <em key={`italic-${lineIndex}-${partIdx}-${keyCounter++}`}>
              {italicMatch[1] || italicMatch[2]}
            </em>
          );
          partLastIndex = italicMatch.index + italicMatch[0].length;
        }
        
        if (partLastIndex < part.length) {
          parts.push(part.slice(partLastIndex));
        }
      } else {
        parts.push(part);
      }
    });

    // Inline code: `code`
    const finalParts: (string | JSX.Element)[] = [];
    parts.forEach((part, partIdx) => {
      if (typeof part === 'string') {
        const codeRegex = /`([^`]+)`/g;
        let codeMatch;
        let partLastIndex = 0;
        
        while ((codeMatch = codeRegex.exec(part)) !== null) {
          if (codeMatch.index > partLastIndex) {
            finalParts.push(part.slice(partLastIndex, codeMatch.index));
          }
          finalParts.push(
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
              {codeMatch[1]}
            </code>
          );
          partLastIndex = codeMatch.index + codeMatch[0].length;
        }
        
        if (partLastIndex < part.length) {
          finalParts.push(part.slice(partLastIndex));
        }
      } else {
        finalParts.push(part);
      }
    });

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
    if (finalParts.length > 0 || line.trim() === '') {
      elements.push(
        <div key={`line-${lineIndex}`} style={{ marginBottom: line.trim() === '' ? '0.5rem' : '0' }}>
          {finalParts.length > 0 ? finalParts : <br />}
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