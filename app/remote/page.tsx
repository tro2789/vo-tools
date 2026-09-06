'use client';

import { useEffect, useState, useCallback, useRef, Suspense, FormEvent, CSSProperties, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown, Wifi, WifiOff, Type, FlipHorizontal2 } from 'lucide-react';

interface TeleprompterState {
  isPlaying: boolean;
  speed: number;
  progress: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  textSize: number;
  isMirrored: boolean;
}

const TEXT_SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

/** Seconds as m:ss. */
const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const sectionLabel: CSSProperties = {
  font: '400 10px Inter, sans-serif',
  letterSpacing: '0.12em',
  color: '#8A8D93',
};

const controlButtonLabel: CSSProperties = {
  font: '600 11px Inter, sans-serif',
  letterSpacing: '0.1em',
};

function ControlButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 h-14 flex items-center justify-center gap-1.5 border border-[#333] bg-transparent text-white disabled:opacity-40 disabled:cursor-not-allowed active:bg-[#1A1A1A]"
    >
      {icon}
      <span style={controlButtonLabel}>{label}</span>
    </button>
  );
}

function RemoteControl() {
  const searchParams = useSearchParams();
  const paramRoomCode = searchParams.get('room');

  const [roomCode, setRoomCode] = useState(paramRoomCode ?? '');
  const [roomInput, setRoomInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<TeleprompterState>({
    isPlaying: false,
    speed: 1.0,
    progress: 0,
    elapsedSeconds: 0,
    remainingSeconds: 0,
    textSize: 3,
    isMirrored: false,
  });
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    // Connect to Socket.IO on same origin (integrated into Next.js server)
    const socket = io({
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
  const handleTextSizeBigger = () => sendCommand('textBigger');
  const handleTextSizeSmaller = () => sendCommand('textSmaller');
  const handleToggleMirror = () => sendCommand('toggleMirror');

  const handleJoinSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = roomInput.trim().toUpperCase();
    if (trimmed) {
      setRoomCode(trimmed);
    }
  };

  // Room-entry state: no room code yet, let the user type one in.
  if (!roomCode) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-xs flex flex-col gap-6">
          <div className="text-center">
            <div style={{ font: '700 11px Inter, sans-serif', letterSpacing: '0.16em', color: '#fff' }}>
              VO TOOLS · REMOTE
            </div>
            <div style={{ font: '400 11px Inter, sans-serif', color: '#8A8D93', marginTop: 6 }}>
              Enter the room code shown on the teleprompter
            </div>
          </div>
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
            <label htmlFor="room-code-input" className="sr-only">
              Room code
            </label>
            <input
              id="room-code-input"
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="ROOM CODE"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-14 w-full px-4 bg-[#131313] border border-[#333] text-white text-center placeholder:text-[#5F6167] focus:outline-none"
              style={{ font: '600 14px Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            />
            <button
              type="submit"
              disabled={!roomInput.trim()}
              className="h-14 w-full bg-white text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed active:bg-[#E4E4E4]"
              style={{ font: '600 13px Inter, sans-serif', letterSpacing: '0.1em' }}
            >
              JOIN ROOM
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isLinked = connected && joined;
  const statusLabel = isLinked ? 'LINKED' : connected ? 'WAITING' : 'OFFLINE';
  const progressPct = Math.round(state.progress * 100);
  const textSizeLabel = TEXT_SIZE_LABELS[state.textSize - 1] || 'M';

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white flex flex-col select-none touch-manipulation" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Prevent zoom on mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #262626' }} className="flex items-center justify-between">
        <div>
          <div style={{ font: '700 11px Inter, sans-serif', letterSpacing: '0.16em', color: '#fff' }}>
            VO TOOLS · REMOTE
          </div>
          <div style={{ font: '400 11px Inter, sans-serif', color: '#8A8D93', marginTop: 3 }}>
            ROOM {roomCode}
          </div>
        </div>
        <div className="flex items-center gap-1.5" style={{ font: '400 11px Inter, sans-serif', color: '#fff' }}>
          {isLinked ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #262626', background: '#3A1512' }}>
          <p style={{ font: '400 11px Inter, sans-serif', color: '#E5867F' }}>{error}</p>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ padding: 16, gap: 16 }}>
        {/* Progress */}
        <div>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
            <span style={sectionLabel}>PROGRESS</span>
            <span style={{ font: '600 12px Inter, sans-serif', color: '#fff' }}>{progressPct}%</span>
          </div>
          <div style={{ height: 4, background: '#262626' }}>
            <div style={{ width: `${progressPct}%`, height: 4, background: '#fff' }} />
          </div>
          <div className="flex items-baseline justify-between" style={{ marginTop: 8, font: '400 11px Inter, sans-serif', color: '#8A8D93' }}>
            <span>{formatClock(state.elapsedSeconds)} ELAPSED</span>
            <span>{formatClock(state.remainingSeconds)} LEFT</span>
          </div>
        </div>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={!joined}
          className="w-full flex flex-col items-center justify-center gap-2 bg-white text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed active:bg-[#E4E4E4]"
          style={{ height: 120, border: 'none' }}
        >
          {state.isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
          <span style={{ font: '600 13px Inter, sans-serif', letterSpacing: '0.16em' }}>
            {state.isPlaying ? 'PAUSE' : 'PLAY'}
          </span>
        </button>

        {/* Speed */}
        <div>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
            <span style={sectionLabel}>SPEED</span>
            <span style={{ font: '600 20px Inter, sans-serif', color: '#fff' }}>{state.speed.toFixed(1)}×</span>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <ControlButton onClick={handleSlower} disabled={!joined} icon={<ChevronDown size={18} />} label="SLOWER" />
            <ControlButton onClick={handleFaster} disabled={!joined} icon={<ChevronUp size={18} />} label="FASTER" />
          </div>
        </div>

        {/* Text size */}
        <div>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
            <span style={sectionLabel}>TEXT SIZE</span>
            <span style={{ font: '600 20px Inter, sans-serif', color: '#fff' }}>{textSizeLabel}</span>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <ControlButton onClick={handleTextSizeSmaller} disabled={!joined} icon={<Type size={14} />} label="SMALLER" />
            <ControlButton onClick={handleTextSizeBigger} disabled={!joined} icon={<Type size={20} />} label="BIGGER" />
          </div>
        </div>

        {/* Mirror + Restart, pinned to bottom */}
        <div className="flex mt-auto" style={{ gap: 8 }}>
          <ControlButton
            onClick={handleToggleMirror}
            disabled={!joined}
            icon={<FlipHorizontal2 size={18} />}
            label={`MIRROR ${state.isMirrored ? 'ON' : 'OFF'}`}
          />
          <ControlButton onClick={handleRestart} disabled={!joined} icon={<RotateCcw size={18} />} label="RESTART" />
        </div>
      </div>
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-sm" style={{ font: '400 13px Inter, sans-serif' }}>Loading...</div>
      </div>
    }>
      <RemoteControl />
    </Suspense>
  );
}
