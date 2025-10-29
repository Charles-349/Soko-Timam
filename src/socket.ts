import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
 
let io: SocketIOServer | null = null;
 
/**
 * Initialize Socket.IO and attach to the HTTP server.
 * Call this once in your server entry file.
 */
export function initSocket(server: HTTPServer) {
  if (io) return io;
 
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // or restrict to your frontend origin
      methods: ['GET', 'POST'],
    },
  });
 
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
 
    // allow client to join a room for a specific order
    socket.on('joinOrderRoom', (payload: { orderId?: number | string }) => {
      const orderId = payload?.orderId;
      if (!orderId && orderId !== 0) return;
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });
 
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
 
  return io;
}
 
/**
 * Get the initialized io instance. Throws if not initialized.
 */
export function getIo() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
}
 