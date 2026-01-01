import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface RemoteCommand {
  action: 'play' | 'pause' | 'toggle' | 'faster' | 'slower' | 'restart' | 'setSpeed' | 'scrollTo';
  value?: number;
}

interface RemoteControlState {
  roomCode: string | null;
  phoneConnected: boolean;
  remoteUrl: string | null;
  syncState: (state: TeleprompterState) => void;
  disconnect: () => void;
}

interface TeleprompterState {
  isPlaying: boolean;
  speed: number;
  progress: number; // 0-1
  textSize: number;
  isMirrored: boolean;
}

export function useRemoteControl(
  onCommand: (action: string, value?: number) => void
): RemoteControlState {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onCommandRef = useRef(onCommand);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    // Determine the Socket.IO server URL
    let apiUrl: string;
    
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Use environment variable if set
      apiUrl = process.env.NEXT_PUBLIC_API_URL;
    } else if (typeof window !== 'undefined') {
      const port = window.location.port;
      
      // If accessing with explicit port, map to API port
      if (port === '3011') {
        // Development: Next.js on 3011, Flask on 5001
        apiUrl = `${window.location.protocol}//${window.location.hostname}:5001`;
      } else if (port === '3010') {
        // Production: Next.js on 3010, Flask on 5000
        apiUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
      } else {
        // No port or unknown port = proxied access, use same domain
        apiUrl = `${window.location.protocol}//${window.location.host}`;
      }
    } else {
      apiUrl = 'http://localhost:5001';
    }
    
    console.log('Connecting to Socket.IO server at:', apiUrl);
    
    // Connect to Flask-SocketIO server
    const socket = io(apiUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Request room creation
    socket.on('connect', () => {
      console.log('Connected to SocketIO server');
      socket.emit('create_room');
    });

    // Handle room creation response
    socket.on('room_created', (data: { roomCode: string }) => {
      console.log('Room created:', data.roomCode);
      setRoomCode(data.roomCode);
      
      // Generate remote URL
      if (typeof window !== 'undefined') {
        const baseUrl = `${window.location.protocol}//${window.location.host}`;
        const url = `${baseUrl}/remote?room=${data.roomCode}`;
        setRemoteUrl(url);
      }
    });

    // Handle phone connection
    socket.on('phone_connected', () => {
      console.log('Phone remote connected');
      setPhoneConnected(true);
    });

    // Handle phone disconnection
    socket.on('phone_disconnected', () => {
      console.log('Phone remote disconnected');
      setPhoneConnected(false);
    });

    // Handle commands from phone
    socket.on('command', (data: RemoteCommand) => {
      console.log('Received command:', data);
      onCommandRef.current(data.action, data.value);
    });

    // Handle errors
    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array - only run once on mount

  // Function to sync state to phone
  const syncState = useCallback((state: TeleprompterState) => {
    if (socketRef.current && phoneConnected) {
      socketRef.current.emit('state_update', state);
    }
  }, [phoneConnected]);

  // Function to manually disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setRoomCode(null);
      setPhoneConnected(false);
      setRemoteUrl(null);
    }
  }, []);

  return {
    roomCode,
    phoneConnected,
    remoteUrl,
    syncState,
    disconnect,
  };
}
