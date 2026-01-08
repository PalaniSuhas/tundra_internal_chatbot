import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types';
import { chatAPI } from '../services/api';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  }, [currentSessionId]);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat?')) {
      try {
        await chatAPI.deleteSession(sessionId);
        loadSessions();
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
      width: '280px', 
      background: '#1a1a2e', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #2d2d44' }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            style={{
              padding: '0.75rem',
              margin: '0.25rem 0',
              background: currentSessionId === session.id ? '#2d2d44' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentSessionId !== session.id) {
                e.currentTarget.style.background = '#25253a';
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
              fontSize: '0.9rem'
            }}>
              {session.title}
            </span>
            <button
              onClick={(e) => handleDelete(session.id, e)}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ padding: '1rem', borderTop: '1px solid #2d2d44' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'transparent',
            color: '#999',
            border: '1px solid #2d2d44',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};