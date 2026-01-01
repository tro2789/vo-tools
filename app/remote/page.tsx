'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown, Wifi, WifiOff } from 'lucide-react';

interface TeleprompterState {
  isPlaying: boolean;
  speed: number;
  progress: number;
}

function RemoteControl() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<TeleprompterState>({
    isPlaying: false,
    speed: 1.0,
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setError('No room code provided');
      return;
    }

    // Determine the Socket.IO server URL
    let apiUrl: string;
    
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Use environment variable if set
      apiUrl = process.env.NEXT_PUBLIC_API_URL;
    } else {
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

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      // Join the room
      socket.emit('join_room', { roomCode });
    });

    socket.on('joined_room', () => {
      console.log('Joined room successfully');
      setJoined(true);
      setError(null);
    });

    socket.on('state_update', (newState: TeleprompterState) => {
      console.log('State update:', newState);
      setState(newState);
    });

    socket.on('desktop_disconnected', () => {
      console.log('Desktop disconnected');
      setError('Desktop disconnected');
      setJoined(false);
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setJoined(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode]);

  const sendCommand = useCallback((action: string, value?: number) => {
    if (socketRef.current && joined) {
      socketRef.current.emit('command', { action, value });
    }
  }, [joined]);

  const handlePlayPause = () => sendCommand('toggle');
  const handleFaster = () => sendCommand('faster');
  const handleSlower = () => sendCommand('slower');
  const handleRestart = () => sendCommand('restart');

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Invalid Link</h1>
          <p className="text-slate-400">No room code provided in URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col select-none touch-manipulation">
      {/* Prevent zoom on mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Teleprompter Remote</h1>
            <p className="text-xs text-slate-400">Room: {roomCode}</p>
          </div>
          <div className="flex items-center gap-2">
            {connected && joined ? (
              <div className="flex items-center gap-1.5 text-green-400 text-sm">
                <Wifi className="w-4 h-4" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-400 text-sm">
                <WifiOff className="w-4 h-4" />
                <span>Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-3">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        
        {/* Progress Bar */}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Progress</span>
            <span className="text-sm font-mono text-slate-300">
              {Math.round(state.progress * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={!joined}
          className={`w-full h-32 rounded-2xl font-bold text-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            state.isPlaying
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30'
              : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            {state.isPlaying ? (
              <>
                <Pause className="w-12 h-12" fill="currentColor" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-12 h-12" fill="currentColor" />
                <span>PLAY</span>
              </>
            )}
          </div>
        </button>

        {/* Speed Control */}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-center mb-3">
            <div className="text-sm text-slate-400 mb-1">Speed</div>
            <div className="text-3xl font-bold font-mono text-blue-400">
              {state.speed.toFixed(1)}x
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSlower}
              disabled={!joined}
              className="h-20 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDown className="w-8 h-8" />
              <span className="text-sm font-semibold">SLOWER</span>
            </button>
            
            <button
              onClick={handleFaster}
              disabled={!joined}
              className="h-20 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronUp className="w-8 h-8" />
              <span className="text-sm font-semibold">FASTER</span>
            </button>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          disabled={!joined}
          className="w-full h-16 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="font-semibold text-lg">RESTART</span>
        </button>

        {/* Connection Instructions */}
        {!joined && !error && (
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 text-center">
            <p className="text-blue-200 text-sm">
              Connecting to desktop teleprompter...
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-3 text-center">
        <p className="text-xs text-slate-500">
          VO Tools • Teleprompter Remote Control
        </p>
      </div>
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <RemoteControl />
    </Suspense>
  );
}
