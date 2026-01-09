import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types';
import { chatAPI } from '../services/api';
import { Plus, Trash2, LogOut, Moon, Sun, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentSessionId, 
  onSelectSession,
  onNewChat 
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const loadSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Reload sessions every 30 seconds instead of on every change
    const interval = setInterval(loadSessions, 30000);
    
    return () => clearInterval(interval);
  }, []); // Only run once on mount

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat?')) {
      try {
        await chatAPI.deleteSession(sessionId);
        await loadSessions(); // Reload after delete
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  return (
    <div style={{ 
      width: '300px', 
      background: 'var(--bg-200)', 
      color: 'var(--text-100)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      borderRight: '1px solid var(--bg-300)'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1.25rem', 
        borderBottom: '1px solid var(--bg-300)',
        background: 'var(--bg-100)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <MessageSquare size={28} color="var(--accent-100)" />
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700,
            color: 'var(--text-100)'
          }}>
            Chat App
          </h2>
        </div>
        
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: `linear-gradient(135deg, var(--primary-200) 0%, var(--accent-100) 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>
      
      {/* Chat Sessions */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '0.75rem'
      }}>
        {sessions.length === 0 ? (
          <div style={{ 
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'var(--text-200)',
            fontSize: '0.9rem'
          }}>
            No chats yet. Start a new conversation!
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              style={{
                padding: '0.875rem',
                margin: '0.375rem 0',
                background: currentSessionId === session.id ? 'var(--bg-300)' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                border: currentSessionId === session.id ? '1px solid var(--accent-100)' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.background = 'var(--bg-300)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentSessionId !== session.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ 
                flex: 1, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
                color: 'var(--text-100)',
                fontWeight: currentSessionId === session.id ? 600 : 400
              }}>
                {session.title}
              </span>
              <button
                onClick={(e) => handleDelete(session.id, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-200)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-200)';
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid var(--bg-300)',
        background: 'var(--bg-100)'
      }}>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-300)',
            color: 'var(--text-100)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            fontWeight: 500,
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-200)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-300)'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'transparent',
            color: 'var(--text-200)',
            border: '1px solid var(--bg-300)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--bg-300)';
            e.currentTarget.style.color = 'var(--text-200)';
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};