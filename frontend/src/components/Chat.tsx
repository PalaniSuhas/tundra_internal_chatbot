import React, { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { chatAPI } from '../services/api';
import { wsService } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FileUpload } from './FileUpload';
import { WelcomeScreen } from './WelcomeScreen';

export const Chat: React.FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const { user } = useAuth();

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await chatAPI.getMessages(sessionId);
      setMessages(response.data);
      // If session has messages, don't show welcome screen
      if (response.data.length > 0) {
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectSession = useCallback(async (sessionId: string) => {
    // Disconnect existing connection first
    wsService.disconnect();
    
    // Clear states immediately
    setCurrentSessionId(sessionId);
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    
    // Save last session
    localStorage.setItem('lastSessionId', sessionId);
    
    // Load messages
    await loadMessages(sessionId);

    // Small delay to ensure previous connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Connect to new session
    wsService.connect(sessionId, (data) => {
      if (data.type === 'chunk') {
        setStreamingContent((prev) => prev + data.content);
        setIsStreaming(true);
      } else if (data.type === 'end') {
        setStreamingContent('');
        setIsStreaming(false);
        loadMessages(sessionId);
      }
    });
  }, []);

  const handleNewChat = async () => {
    try {
      const response = await chatAPI.createSession();
      const sessionId = response.data.session_id;
      setShowWelcome(true); // Show welcome for new chats
      await handleSelectSession(sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        // Check for existing sessions first
        const sessionsResponse = await chatAPI.getSessions();
        const existingSessions = sessionsResponse.data;
        
        // Check if there's a last session stored
        const lastSessionId = localStorage.getItem('lastSessionId');
        
        if (lastSessionId && existingSessions.some((s: any) => s.id === lastSessionId)) {
          // Last session exists, load it
          await handleSelectSession(lastSessionId);
        } else if (existingSessions.length > 0) {
          // No valid last session, but user has sessions - load most recent
          await handleSelectSession(existingSessions[0].id);
        } else {
          // Brand new user, no sessions - create first one
          await handleNewChat();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // If anything fails, try to create new chat
        try {
          await handleNewChat();
        } catch (createError) {
          console.error('Failed to create new chat:', createError);
        }
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Cleanup: disconnect WebSocket when component unmounts
    return () => {
      console.log('Chat component unmounting, disconnecting WebSocket');
      wsService.disconnect();
    };
  }, []);

  const handleSendMessage = (content: string) => {
    if (currentSessionId) {
      setShowWelcome(false); // Hide welcome when user sends message
      wsService.sendMessage(content);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleResendMessage = (content: string) => {
    // Resend the message - this will trigger a new response
    handleSendMessage(content);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-100)',
        color: 'var(--text-100)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--bg-300)',
            borderTop: '4px solid var(--accent-100)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Initializing workspace...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-100)' }}>
      <Sidebar
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--bg-100)' 
      }}>
        {currentSessionId && (
          <>
            <FileUpload sessionId={currentSessionId} />
            {showWelcome && messages.length === 0 && !isStreaming ? (
              <WelcomeScreen 
                username={user?.username || 'User'} 
                onPromptClick={handlePromptClick}
              />
            ) : (
              <MessageList 
                messages={messages} 
                streamingContent={streamingContent}
                onResendMessage={handleResendMessage}
              />
            )}
            <MessageInput 
              onSendMessage={handleSendMessage}
              disabled={isStreaming || !currentSessionId}
            />
          </>
        )}
      </div>
    </div>
  );
};