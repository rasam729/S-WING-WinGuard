import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@shared/constants';
import { useAuthStore } from '../store/authStore';

const WS_URL = 'ws://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
    this.authenticate();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.authenticate();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on(WS_EVENTS.AUTHENTICATED, () => {
      console.log('WebSocket authenticated');
      this.subscribeToUpdates();
    });

    this.socket.on(WS_EVENTS.AUTH_ERROR, (data) => {
      console.error('WebSocket auth error:', data);
      this.disconnect();
    });

    this.socket.on(WS_EVENTS.SUBSCRIBED, (data) => {
      console.log('Subscribed to updates:', data);
    });
  }

  private authenticate(): void {
    const token = useAuthStore.getState().token;
    if (token && this.socket) {
      this.socket.emit(WS_EVENTS.AUTHENTICATE, { token });
    }
  }

  private subscribeToUpdates(): void {
    const user = useAuthStore.getState().user;
    if (user && this.socket) {
      this.socket.emit(WS_EVENTS.SUBSCRIBE_UPDATES, { role: user.role });
    }
  }

  // Event listeners
  onIssueResolved(callback: (data: any) => void): void {
    this.socket?.on(WS_EVENTS.ISSUE_RESOLVED, callback);
  }

  onInfrastructureUpdated(callback: (data: any) => void): void {
    this.socket?.on(WS_EVENTS.INFRASTRUCTURE_UPDATED, callback);
  }

  onConnectionStatus(callback: (data: any) => void): void {
    this.socket?.on(WS_EVENTS.CONNECTION_STATUS, callback);
  }

  // Remove listeners
  offIssueResolved(callback: (data: any) => void): void {
    this.socket?.off(WS_EVENTS.ISSUE_RESOLVED, callback);
  }

  offInfrastructureUpdated(callback: (data: any) => void): void {
    this.socket?.off(WS_EVENTS.INFRASTRUCTURE_UPDATED, callback);
  }

  offConnectionStatus(callback: (data: any) => void): void {
    this.socket?.off(WS_EVENTS.CONNECTION_STATUS, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
