const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private messageHandler: ((data: any) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(sessionId: string, onMessage: (data: any) => void) {
    this.sessionId = sessionId;
    this.messageHandler = onMessage;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    // Add token as query parameter for WebSocket authentication
    this.ws = new WebSocket(`${WS_URL}/api/chat/ws/${sessionId}?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageHandler) {
          this.messageHandler(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
  }
  
  sendMessage(content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ content }));
    } else {
      console.error('WebSocket is not connected');
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId && this.messageHandler) {
      this.reconnectAttempts++;
      const delay = 2000 * this.reconnectAttempts;
      console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        this.connect(this.sessionId!, this.messageHandler!);
      }, delay);
    }
  }
}

export const wsService = new WebSocketService();