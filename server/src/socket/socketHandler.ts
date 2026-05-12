/**
 * WebSocket Handler
 * Socket.io event handlers for real-time communication
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WS_EVENTS } from '@shared/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    role: 'citizen' | 'official';
  };
}

export function initializeSocketIO(io: SocketIOServer): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle authentication
    socket.on(WS_EVENTS.AUTHENTICATE, async (payload: { token: string }) => {
      try {
        const decoded = jwt.verify(payload.token, JWT_SECRET) as {
          id: string;
          username: string;
          role: 'citizen' | 'official';
        };

        socket.user = decoded;
        socket.emit(WS_EVENTS.AUTHENTICATED, { success: true });
        console.log(`Client authenticated: ${socket.id} (${decoded.role})`);
      } catch (error) {
        socket.emit(WS_EVENTS.AUTH_ERROR, { error: 'Invalid token' });
        socket.disconnect();
      }
    });

    // Handle subscription to updates
    socket.on(WS_EVENTS.SUBSCRIBE_UPDATES, (_payload: { role: string }) => {
      if (!socket.user) {
        socket.emit(WS_EVENTS.AUTH_ERROR, { error: 'Not authenticated' });
        return;
      }

      // Join role-specific room
      socket.join(`role:${socket.user.role}`);
      socket.emit(WS_EVENTS.SUBSCRIBED, { role: socket.user.role });
      console.log(`Client subscribed to ${socket.user.role} updates: ${socket.id}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    // Send connection status
    socket.emit(WS_EVENTS.CONNECTION_STATUS, {
      connected: true,
      latency: 0
    });
  });
}

/**
 * Broadcast new safety issue to all officials
 */
export function broadcastNewIssue(io: SocketIOServer, issue: any): void {
  io.to('role:official').emit(WS_EVENTS.NEW_ISSUE, issue);
}

/**
 * Broadcast issue resolution to all clients
 */
export function broadcastIssueResolved(io: SocketIOServer, data: { issueId: string; resolvedAt: string }): void {
  io.emit(WS_EVENTS.ISSUE_RESOLVED, data);
}

/**
 * Broadcast infrastructure update to all clients
 */
export function broadcastInfrastructureUpdate(io: SocketIOServer, infrastructure: any): void {
  io.emit(WS_EVENTS.INFRASTRUCTURE_UPDATED, infrastructure);
}
