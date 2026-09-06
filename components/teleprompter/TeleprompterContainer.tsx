'use client';

import React, { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { FileText, FlipHorizontal2, Play, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { QRCodeCanvas } from '@/components/QRCode';
import { TeleprompterDisplay } from './TeleprompterDisplay';
import { ScriptEditorWithPronunciation } from '@/components/editor/ScriptEditorWithPronunciation';
import {
  Button,
  DocumentBar,
  Kbd,
  RailSection,
  SavedIndicator,
  StatusBar,
  Workspace,
} from '@/components/shell';
import { useTeleprompter } from '@/hooks/useTeleprompter';
import { useScriptAnalysis } from '@/hooks/useScriptAnalysis';
import { useRemoteControl } from '@/hooks/useRemoteControl';
import { useScriptDocument } from '@/hooks/useScriptDocument';
import { DEFAULT_EXPANSION_OPTIONS } from '@/utils/expansionOptions';

interface TeleprompterContainerProps {
  initialScript?: string;
  initialWpm?: number;
}

const DEFAULT_WPM = 150;
const MIN_WPM = 75;
const MAX_WPM = 200;
const SETTINGS_KEY = 'vo-tools-teleprompter';

const KEYBOARD_ROWS: Array<[string, string]> = [
  ['Play / pause', 'SPACE'],
  ['Adjust speed', '↑ ↓'],
  ['Text size', '+ −'],
  ['Mirror', 'M'],
  ['Reset to start', 'HOME'],
  ['Exit fullscreen', 'ESC'],
];

/** Seconds as m:ss. */
const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Persisted teleprompter settings (`{ wpm }`), read through `useSyncExternalStore`
 * so the value survives reloads without tripping a hydration mismatch.
 */
const wpmListeners = new Set<() => void>();
let cachedWpmRaw: string | null = null;
let cachedWpm: number | null = null;

function readStoredWpm(): number | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
  if (raw === cachedWpmRaw) return cachedWpm;
  cachedWpmRaw = raw;
  cachedWpm = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { wpm?: unknown };
      if (typeof parsed.wpm === 'number' && Number.isFinite(parsed.wpm)) {
        cachedWpm = Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(parsed.wpm)));
      }
    } catch {
      // Corrupt entry — fall back to the default.
    }
  }
  return cachedWpm;
}

function subscribeWpm(listener: () => void) {
  wpmListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SETTINGS_KEY) {
      wpmListeners.forEach((fn) => fn());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    wpmListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getServerWpm(): number | null {
  return null;
}

export const TeleprompterContainer: React.FC<TeleprompterContainerProps> = ({
  initialScript = '',
  initialWpm = DEFAULT_WPM,
}) => {
  const { text, setText, title, setTitle } = useScriptDocument();

  const [isFullscreen, setIsFullscreen] = useState(false);
  // Raw text while the WPM field is being typed into, so partial values stay editable.
  const [wpmDraft, setWpmDraft] = useState<string | null>(null);
  const seededRef = useRef(false);

  // `initialWpm` is the fallback until a value has been stored.
  const storedWpm = useSyncExternalStore(subscribeWpm, readStoredWpm, getServerWpm);
  const wpm = storedWpm ?? initialWpm;

  const setWpm = useCallback((next: number) => {
    if (!Number.isFinite(next)) return;
    const clamped = Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(next)));
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ wpm: clamped }));
    } catch {
      // Storage unavailable — keep the in-memory value.
      cachedWpmRaw = null;
      cachedWpm = clamped;
    }
    wpmListeners.forEach((fn) => fn());
  }, []);

  // `initialScript` is a fallback: it only seeds an empty shared document.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (initialScript && !text) {
      setText(initialScript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScript]);

  // Analyze script to get word count for timing
  const { wordCount } = useScriptAnalysis(text, wpm, DEFAULT_EXPANSION_OPTIONS);

  // Exit fullscreen
  const handleExit = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Teleprompter hook
  const teleprompter = useTeleprompter({
    wpm,
    totalWords: wordCount,
    onExit: handleExit,
  });

  // Handle remote commands
  const handleRemoteCommand = useCallback((action: string, value?: number) => {
    switch (action) {
      case 'play':
        if (!teleprompter.isPlaying) teleprompter.togglePlayPause();
        break;
      case 'pause':
        if (teleprompter.isPlaying) teleprompter.togglePlayPause();
        break;
      case 'toggle':
        teleprompter.togglePlayPause();
        break;
      case 'faster':
        teleprompter.adjustSpeed(0.1);
        break;
      case 'slower':
        teleprompter.adjustSpeed(-0.1);
        break;
      case 'restart':
        teleprompter.reset();
        break;
      case 'textBigger':
        teleprompter.adjustTextSize(1);
        break;
      case 'textSmaller':
        teleprompter.adjustTextSize(-1);
        break;
      case 'toggleMirror':
        teleprompter.toggleMirror();
        break;
      case 'setSpeed':
        if (value !== undefined) {
          // Set speed directly (would need to add this to teleprompter hook)
          teleprompter.adjustSpeed(value - teleprompter.speedMultiplier);
        }
        break;
      case 'scrollTo':
        if (value !== undefined) {
          // Scroll to position (would need to add this to teleprompter hook)
          // For now, just log it
          console.log('Scroll to:', value);
        }
        break;
    }
  }, [teleprompter]);

  // Remote control hook
  const remote = useRemoteControl(handleRemoteCommand);

  // Sync state to phone when it changes
  useEffect(() => {
    if (remote.phoneConnected && isFullscreen) {
      const progress = teleprompter.elapsedTime / (teleprompter.estimatedTotalTime || 1);
      remote.syncState({
        isPlaying: teleprompter.isPlaying,
        speed: teleprompter.speedMultiplier,
        progress: Math.min(progress, 1),
        elapsedSeconds: teleprompter.elapsedTime,
        remainingSeconds: Math.max(teleprompter.estimatedTotalTime - teleprompter.elapsedTime, 0),
        textSize: teleprompter.textSize,
        isMirrored: teleprompter.isMirrored,
      });
    }
  }, [
    remote,
    isFullscreen,
    teleprompter.isPlaying,
    teleprompter.speedMultiplier,
    teleprompter.elapsedTime,
    teleprompter.estimatedTotalTime,
    teleprompter.textSize,
    teleprompter.isMirrored,
  ]);

  // Start teleprompter (enter fullscreen mode)
  const handleStart = () => {
    if (text.trim()) {
      teleprompter.reset();
      setIsFullscreen(true);
    }
  };

  // Reset playback state and the reading speed — the document is left alone.
  const handleResetSettings = () => {
    teleprompter.reset();
    setWpm(DEFAULT_WPM);
  };

  if (isFullscreen && text) {
    return (
      <TeleprompterDisplay
        script={text}
        isPlaying={teleprompter.isPlaying}
        scrollPosition={teleprompter.scrollPosition}
        speedMultiplier={teleprompter.speedMultiplier}
        textSize={teleprompter.textSize}
        isMirrored={teleprompter.isMirrored}
        elapsedTime={teleprompter.elapsedTime}
        estimatedTotalTime={teleprompter.estimatedTotalTime}
        onTogglePlayPause={teleprompter.togglePlayPause}
        onAdjustSpeed={teleprompter.adjustSpeed}
        onAdjustTextSize={teleprompter.adjustTextSize}
        onToggleMirror={teleprompter.toggleMirror}
        onReset={teleprompter.reset}
        onExit={handleExit}
      />
    );
  }

  const estimatedRun = formatClock(wordCount === 0 ? 0 : (wordCount / (wpm || DEFAULT_WPM)) * 60);

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col">
      <DocumentBar
        icon={FileText}
        title={
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled script"
            aria-label="Script title"
            className="w-[200px] max-w-full border-none bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-disabled sm:w-[280px]"
          />
        }
        meta={<SavedIndicator state={text ? 'saved' : 'empty'} />}
        actions={
          <>
            <Button
              tone="muted"
              icon={FlipHorizontal2}
              onClick={teleprompter.toggleMirror}
              aria-pressed={teleprompter.isMirrored}
            >
              {teleprompter.isMirrored ? 'Mirror on' : 'Mirror off'}
            </Button>
            <Button tone="muted" icon={RotateCcw} onClick={handleResetSettings}>
              Reset
            </Button>
          </>
        }
      />

      <Workspace
        mainClassName="min-h-[200px] lg:min-h-[640px]"
        main={
          <ScriptEditorWithPronunciation
            value={text}
            onChange={setText}
            placeholder="Paste your script here..."
            label="Script Text"
            height="flex-1 min-h-[200px] lg:min-h-[640px]"
            showPronunciationToggle={true}
          />
        }
        rail={
          <>
            <RailSection pad={16}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Scroll speed
                  </div>
                  <div className="mt-[6px] text-[40px]/[1] font-semibold text-ink">{wpm}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Est. run
                  </div>
                  <div className="mt-[6px] text-[40px]/[1] font-semibold text-ink">
                    {estimatedRun}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-[10px]">
                <input
                  type="range"
                  min={MIN_WPM}
                  max={MAX_WPM}
                  value={wpm}
                  aria-label="Reading speed in words per minute"
                  onChange={(event) => setWpm(Number(event.target.value))}
                  className="h-1 min-w-0 flex-1"
                />
                <input
                  type="number"
                  min={MIN_WPM}
                  max={MAX_WPM}
                  value={wpmDraft ?? wpm}
                  aria-label="Words per minute"
                  onChange={(event) => {
                    setWpmDraft(event.target.value);
                    const next = Number(event.target.value);
                    if (Number.isFinite(next) && next >= MIN_WPM && next <= MAX_WPM) {
                      setWpm(next);
                    }
                  }}
                  onBlur={(event) => {
                    setWpmDraft(null);
                    setWpm(Number(event.target.value));
                  }}
                  className="h-[26px] w-[52px] border border-line-strong bg-panel px-[6px] text-right text-[12px] text-ink outline-none"
                />
                <span className="text-[10px] text-muted">WPM</span>
              </div>
              <div className="mt-[6px] flex justify-between text-[10px] text-muted">
                <span>{MIN_WPM}</span>
                <span>{MAX_WPM}</span>
              </div>
            </RailSection>

            <RailSection pad={16} label="Phone remote">
              <div className="flex items-start gap-[14px]">
                <div
                  className="flex h-[96px] w-[96px] shrink-0 items-center justify-center border border-line text-center text-[9px] text-muted"
                  style={
                    remote.remoteUrl
                      ? undefined
                      : {
                          background:
                            'repeating-linear-gradient(45deg, var(--line) 0 5px, var(--subtle) 5px 10px)',
                        }
                  }
                >
                  {remote.remoteUrl ? (
                    <QRCodeCanvas value={remote.remoteUrl} size={96} level="M" includeMargin={false} />
                  ) : (
                    <>
                      QR
                      <br />
                      CODE
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted">ROOM</div>
                  <div className="text-[18px] font-semibold tracking-[0.08em] text-ink">
                    {remote.roomCode ?? '———'}
                  </div>
                  <div className="mt-2 flex items-center gap-[6px] text-[11px] text-muted">
                    {remote.phoneConnected ? (
                      <>
                        <Wifi width={13} height={13} aria-hidden="true" />
                        PHONE LINKED
                      </>
                    ) : (
                      <>
                        <WifiOff width={13} height={13} aria-hidden="true" />
                        WAITING FOR PHONE
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[11px]/[1.5] text-muted">
                    Scan to control play, speed, text size and mirror from your phone.
                  </p>
                </div>
              </div>
            </RailSection>

            <RailSection pad={16} label="Keyboard">
              <div className="flex flex-col gap-[6px]">
                {KEYBOARD_ROWS.map(([label, key]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-body">{label}</span>
                    <Kbd>{key}</Kbd>
                  </div>
                ))}
              </div>
            </RailSection>

            <RailSection pad={16} last className="mt-auto">
              <Button
                variant="primary"
                size={40}
                icon={Play}
                iconFilled
                className="w-full"
                onClick={handleStart}
                disabled={!text.trim()}
              >
                Start teleprompter
              </Button>
            </RailSection>
          </>
        }
      />

      <StatusBar
        left={[
          `${wordCount} WORDS`,
          `EST ${estimatedRun}`,
          `${wpm} WPM`,
          `MIRROR ${teleprompter.isMirrored ? 'ON' : 'OFF'}`,
        ]}
        right={[
          `ROOM ${remote.roomCode ?? '—'}`,
          `REMOTE ${remote.phoneConnected ? 'LINKED' : 'WAITING'}`,
        ]}
      />
    </div>
  );
};
