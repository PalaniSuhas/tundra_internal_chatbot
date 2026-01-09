const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private messageHandler: ((data: any) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  connect(sessionId: string, onMessage: (data: any) => void) {
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      console.log('Already connecting, skipping...');
      return;
    }

    // If already connected to same session, don't reconnect
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionId === sessionId) {
      console.log('Already connected to this session');
      return;
    }

    // Disconnect existing connection
    this.disconnect();

    this.isConnecting = true;
    this.sessionId = sessionId;
    this.messageHandler = onMessage;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      this.isConnecting = false;
      return;
    }
    
    console.log(`Connecting WebSocket to session: ${sessionId}`);
    
    // Add token as query parameter for WebSocket authentication
    this.ws = new WebSocket(`${WS_URL}/api/chat/ws/${sessionId}?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
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
      this.isConnecting = false;
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      this.isConnecting = false;
      
      // Only attempt reconnect if it wasn't a normal closure
      if (event.code !== 1000 && event.code !== 1001) {
        this.attemptReconnect();
      }
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
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Close WebSocket connection
    if (this.ws) {
      console.log('Disconnecting WebSocket');
      
      // Remove event listeners to prevent reconnect attempts
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      
      // Close connection
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Normal closure');
      }
      
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.sessionId = null;
    this.messageHandler = null;
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId && this.messageHandler) {
      this.reconnectAttempts++;
      const delay = 2000 * this.reconnectAttempts;
      console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.sessionId && this.messageHandler) {
          this.connect(this.sessionId, this.messageHandler);
        }
      }, delay);
    }
  }
}

export const wsService = new WebSocketService();