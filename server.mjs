import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import crypto from 'crypto';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// --- Room Management (inlined for standalone server) ---
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const activeRooms = new Map();

// WebSocket rate limiting
const wsRateLimits = new Map();
const WS_RATE_LIMIT_WINDOW = 60; // seconds
const WS_MAX_REQUESTS = parseInt(process.env.WS_RATE_LIMIT_PER_MINUTE || '30', 10);

function generateRoomCode() {
  let code;
  do {
    code = Array.from(crypto.randomBytes(8))
      .map((b) => CHARSET[b % CHARSET.length])
      .join('');
  } while (activeRooms.has(code));
  return code;
}

function checkRateLimit(sid, maxRequests = WS_MAX_REQUESTS) {
  const now = Date.now() / 1000;
  const timestamps = (wsRateLimits.get(sid) || []).filter(
    (ts) => now - ts < WS_RATE_LIMIT_WINDOW
  );
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  wsRateLimits.set(sid, timestamps);
  return true;
}

// --- Next.js Setup ---
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // --- Socket.IO Setup ---
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: '/socket.io/',
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('create_room', () => {
      if (!checkRateLimit(socket.id, 5)) {
        socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

      const roomCode = generateRoomCode();
      activeRooms.set(roomCode, { desktop: socket.id, phone: null });
      socket.join(roomCode);
      console.log(`Room ${roomCode} created by desktop ${socket.id}`);
      socket.emit('room_created', { roomCode });
    });

    socket.on('join_room', (data) => {
      if (!checkRateLimit(socket.id, 10)) {
        socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

      const roomCode = (data?.roomCode || '').toUpperCase();
      const room = activeRooms.get(roomCode);

      if (!room) {
        socket.emit('error', { message: 'Invalid room code' });
        return;
      }
      if (room.phone !== null) {
        socket.emit('error', { message: 'Room already has a phone connected' });
        return;
      }

      room.phone = socket.id;
      socket.join(roomCode);
      console.log(`Phone ${socket.id} joined room ${roomCode}`);

      // Notify desktop
      io.to(room.desktop).emit('phone_connected');
      // Confirm to phone
      socket.emit('joined_room', { roomCode });
    });

    socket.on('command', (data) => {
      if (!checkRateLimit(socket.id, 60)) {
        socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

      // Find room where this socket is the phone
      let targetDesktop = null;
      for (const [, room] of activeRooms) {
        if (room.phone === socket.id) {
          targetDesktop = room.desktop;
          break;
        }
      }

      if (!targetDesktop) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      io.to(targetDesktop).emit('command', {
        action: data?.action,
        value: data?.value,
      });
    });

    socket.on('state_update', (data) => {
      // Find room where this socket is the desktop
      for (const [, room] of activeRooms) {
        if (room.desktop === socket.id && room.phone) {
          io.to(room.phone).emit('state_update', data);
          return;
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Clean up rate limit data
      wsRateLimits.delete(socket.id);

      // Find and clean up rooms
      for (const [code, room] of activeRooms) {
        if (room.desktop === socket.id) {
          if (room.phone) {
            io.to(room.phone).emit('desktop_disconnected');
          }
          activeRooms.delete(code);
          return;
        }
        if (room.phone === socket.id) {
          room.phone = null;
          io.to(room.desktop).emit('phone_disconnected');
          return;
        }
      }
    });
  });

  // --- Start server ---
  server.listen(port, hostname, () => {
    console.log(`> VO Tools ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO ready on same port`);
    console.log(`> Allowed origins: ${allowedOrigins.join(', ')}`);
  });
});
