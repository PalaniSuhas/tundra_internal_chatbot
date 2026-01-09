import React from 'react';
import { Sparkles, FileText, Code, Lightbulb, HelpCircle } from 'lucide-react';

interface WelcomeScreenProps {
  username: string;
  onPromptClick: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ username, onPromptClick }) => {
  const prompts = [
    {
      icon: <FileText size={24} />,
      title: 'Analyze Documents',
      prompt: 'Help me analyze and summarize my uploaded documents',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: <Code size={24} />,
      title: 'Code Assistant',
      prompt: 'Help me write and debug code for my project',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: <Lightbulb size={24} />,
      title: 'Brainstorm Ideas',
      prompt: 'Help me brainstorm creative ideas for my project',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: <HelpCircle size={24} />,
      title: 'Ask Questions',
      prompt: 'I have questions about a specific topic',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-100)'
    }}>
      {/* Welcome Message */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '2rem 3rem',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <Sparkles size={32} color="var(--accent-100)" />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, var(--accent-100) 0%, var(--accent-200) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Hello, {username}!
          </h1>
        </div>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-200)',
          margin: 0
        }}>
          How can I help you today?
        </p>
      </div>

      {/* Prompt Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1200px',
        width: '100%'
      }}>
        {prompts.map((item, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(item.prompt)}
            style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
              e.currentTarget.style.borderColor = 'var(--accent-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: item.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {item.icon}
            </div>
            <div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-100)',
                marginBottom: '0.5rem'
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-200)',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {item.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};