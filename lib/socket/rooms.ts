import crypto from 'crypto';

interface Room {
  desktop: string;
  phone: string | null;
}

// In-memory room store (same as Flask's active_rooms dict)
const activeRooms = new Map<string, Room>();

// Characters excluding confusing ones (O/0/I/1)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code: string;
  do {
    code = Array.from(crypto.randomBytes(8))
      .map((b) => CHARSET[b % CHARSET.length])
      .join('');
  } while (activeRooms.has(code));
  return code;
}

export function createRoom(desktopSid: string): string {
  const code = generateRoomCode();
  activeRooms.set(code, { desktop: desktopSid, phone: null });
  return code;
}

export function joinRoom(
  roomCode: string,
  phoneSid: string
): { ok: true; desktopSid: string } | { ok: false; error: string } {
  const room = activeRooms.get(roomCode);
  if (!room) return { ok: false, error: 'Invalid room code' };
  if (room.phone !== null) return { ok: false, error: 'Room already has a phone connected' };

  room.phone = phoneSid;
  return { ok: true, desktopSid: room.desktop };
}

export function findRoomByPhone(phoneSid: string): { code: string; room: Room } | null {
  for (const [code, room] of activeRooms) {
    if (room.phone === phoneSid) return { code, room };
  }
  return null;
}

export function findRoomByDesktop(desktopSid: string): { code: string; room: Room } | null {
  for (const [code, room] of activeRooms) {
    if (room.desktop === desktopSid) return { code, room };
  }
  return null;
}

export function handleDisconnect(sid: string): {
  type: 'desktop' | 'phone';
  roomCode: string;
  notifySid: string | null;
} | null {
  for (const [code, room] of activeRooms) {
    if (room.desktop === sid) {
      const phoneSid = room.phone;
      activeRooms.delete(code);
      return { type: 'desktop', roomCode: code, notifySid: phoneSid };
    }
    if (room.phone === sid) {
      room.phone = null;
      return { type: 'phone', roomCode: code, notifySid: room.desktop };
    }
  }
  return null;
}
