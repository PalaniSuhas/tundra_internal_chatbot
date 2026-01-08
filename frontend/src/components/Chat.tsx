import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { chatAPI } from '../services/api';
import { wsService } from '../services/websocket';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FileUpload } from './FileUpload';

export const Chat: React.FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    return () => {
          wsService.disconnect();
};
}, []);
const loadMessages = async (sessionId: string) => {
try {
const response = await chatAPI.getMessages(sessionId);
setMessages(response.data);
} catch (error) {
console.error('Failed to load messages:', error);
}
};
const handleSelectSession = async (sessionId: string) => {
wsService.disconnect();
setCurrentSessionId(sessionId);
setMessages([]);
setStreamingContent('');
await loadMessages(sessionId);
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
};
const handleNewChat = async () => {
try {
const response = await chatAPI.createSession();
const sessionId = response.data.session_id;
await handleSelectSession(sessionId);
} catch (error) {
console.error('Failed to create session:', error);
}
};
const handleSendMessage = (content: string) => {
if (currentSessionId) {
wsService.sendMessage(content);
}
};
useEffect(() => {
handleNewChat();
}, []);
return (
<div style={{ display: 'flex', height: '100vh' }}>
<Sidebar
     currentSessionId={currentSessionId}
     onSelectSession={handleSelectSession}
     onNewChat={handleNewChat}
   />
   <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    {currentSessionId && <FileUpload sessionId={currentSessionId} />}
    
    <MessageList messages={messages} streamingContent={streamingContent} />
    
    <MessageInput 
      onSendMessage={handleSendMessage}
      disabled={isStreaming || !currentSessionId}
    />
  </div>
</div>
);
};