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
  SectionLabel,
  Segmented,
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

type CountdownSeconds = 0 | 3 | 5 | 10;
const DEFAULT_COUNTDOWN_SECONDS: CountdownSeconds = 3;
const COUNTDOWN_OPTIONS: Array<{ value: CountdownSeconds; label: string }> = [
  { value: 0, label: 'Off' },
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
];

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
 * Persisted teleprompter settings (`{ wpm, countdownSeconds }`), read through
 * `useSyncExternalStore` so the values survive reloads without tripping a hydration
 * mismatch.
 */
interface StoredSettings {
  wpm?: number;
  countdownSeconds?: CountdownSeconds;
}

const settingsListeners = new Set<() => void>();
let cachedSettingsRaw: string | null = null;
let cachedWpm: number | null = null;
let cachedCountdownSeconds: CountdownSeconds | null = null;

function parseStoredSettings(raw: string | null): void {
  cachedSettingsRaw = raw;
  cachedWpm = null;
  cachedCountdownSeconds = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { wpm?: unknown; countdownSeconds?: unknown };
      if (typeof parsed.wpm === 'number' && Number.isFinite(parsed.wpm)) {
        cachedWpm = Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(parsed.wpm)));
      }
      if (
        parsed.countdownSeconds === 0 ||
        parsed.countdownSeconds === 3 ||
        parsed.countdownSeconds === 5 ||
        parsed.countdownSeconds === 10
      ) {
        cachedCountdownSeconds = parsed.countdownSeconds;
      }
    } catch {
      // Corrupt entry — fall back to the default.
    }
  }
}

function readStoredWpm(): number | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
  if (raw !== cachedSettingsRaw) parseStoredSettings(raw);
  return cachedWpm;
}

function readStoredCountdownSeconds(): CountdownSeconds | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
  if (raw !== cachedSettingsRaw) parseStoredSettings(raw);
  return cachedCountdownSeconds;
}

function subscribeSettings(listener: () => void) {
  settingsListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SETTINGS_KEY) {
      settingsListeners.forEach((fn) => fn());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    settingsListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getServerSettingsSnapshot(): null {
  return null;
}

/** Merges `partial` into the persisted settings object and notifies subscribers. */
function persistSettings(partial: StoredSettings): void {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    raw = null;
  }
  let current: StoredSettings = {};
  if (raw) {
    try {
      current = JSON.parse(raw) as StoredSettings;
    } catch {
      current = {};
    }
  }
  const next: StoredSettings = { ...current, ...partial };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — keep the in-memory value for what changed.
    cachedSettingsRaw = null;
    if (partial.wpm !== undefined) cachedWpm = partial.wpm;
    if (partial.countdownSeconds !== undefined) cachedCountdownSeconds = partial.countdownSeconds;
  }
  settingsListeners.forEach((fn) => fn());
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
  const storedWpm = useSyncExternalStore(subscribeSettings, readStoredWpm, getServerSettingsSnapshot);
  const wpm = storedWpm ?? initialWpm;

  const storedCountdownSeconds = useSyncExternalStore(
    subscribeSettings,
    readStoredCountdownSeconds,
    getServerSettingsSnapshot
  );
  const countdownSeconds = storedCountdownSeconds ?? DEFAULT_COUNTDOWN_SECONDS;

  const setWpm = useCallback((next: number) => {
    if (!Number.isFinite(next)) return;
    const clamped = Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(next)));
    persistSettings({ wpm: clamped });
  }, []);

  const setCountdownSeconds = useCallback((next: CountdownSeconds) => {
    persistSettings({ countdownSeconds: next });
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

  // Holds the latest teleprompter instance so `handleExit` (passed into the hook as
  // `onExit`, before the hook itself returns) can still cancel an in-progress countdown.
  const teleprompterRef = useRef<ReturnType<typeof useTeleprompter> | null>(null);

  // Exit fullscreen — also cancels a countdown so it can't finish silently in the background.
  const handleExit = useCallback(() => {
    teleprompterRef.current?.cancelCountdown();
    setIsFullscreen(false);
  }, []);

  // Teleprompter hook
  const teleprompter = useTeleprompter({
    wpm,
    totalWords: wordCount,
    countdownSeconds,
    onExit: handleExit,
  });

  useEffect(() => {
    teleprompterRef.current = teleprompter;
  });

  // Handle remote commands
  const handleRemoteCommand = useCallback((action: string, value?: number) => {
    switch (action) {
      case 'play':
        if (!teleprompter.isPlaying) teleprompter.togglePlayPause();
        break;
      case 'pause':
        // Pausing while a countdown is running cancels it; otherwise pause playback.
        if (teleprompter.countdown !== null) {
          teleprompter.cancelCountdown();
        } else if (teleprompter.isPlaying) {
          teleprompter.togglePlayPause();
        }
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

  // Start teleprompter (enter fullscreen mode, then run the pre-roll countdown)
  const handleStart = () => {
    if (text.trim()) {
      teleprompter.reset();
      setIsFullscreen(true);
      teleprompter.startWithCountdown(countdownSeconds);
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
        countdown={teleprompter.countdown}
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Countdown</SectionLabel>
                <Segmented
                  size={26}
                  label="Pre-roll countdown"
                  value={String(countdownSeconds)}
                  onChange={(value) => setCountdownSeconds(Number(value) as CountdownSeconds)}
                  options={COUNTDOWN_OPTIONS.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  }))}
                />
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
          `COUNTDOWN ${countdownSeconds > 0 ? `${countdownSeconds}S` : 'OFF'}`,
        ]}
        right={[
          `ROOM ${remote.roomCode ?? '—'}`,
          `REMOTE ${remote.phoneConnected ? 'LINKED' : 'WAITING'}`,
        ]}
      />
    </div>
  );
};
