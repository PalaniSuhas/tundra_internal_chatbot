import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
}

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
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: '#555'
            }}>
              {message.content}
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
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: '#555'
            }}>
              {streamingContent}
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};