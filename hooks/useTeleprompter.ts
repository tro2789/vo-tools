import { useState, useEffect, useCallback, useRef } from 'react';

export interface TeleprompterState {
  isPlaying: boolean;
  currentLineIndex: number;
  scrollPosition: number;
  speedMultiplier: number;
  textSize: number; // 1-7 (XS to 3XL)
  isMirrored: boolean; // for physical teleprompter mirrors
  elapsedTime: number; // in seconds
  estimatedTotalTime: number; // in seconds
  countdown: number | null; // whole seconds remaining while counting down, else null
}

export interface UseTeleprompterOptions {
  wpm: number;
  totalWords: number;
  /** Length of the pre-roll countdown in whole seconds. 0 disables it. */
  countdownSeconds?: number;
  onExit?: () => void;
}

/**
 * Custom hook for teleprompter functionality
 * Handles auto-scrolling, timing, and keyboard controls
 */
export const useTeleprompter = ({
  wpm,
  totalWords,
  countdownSeconds = 0,
  onExit,
}: UseTeleprompterOptions) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [textSize, setTextSize] = useState(3); // Default to large (3)
  const [isMirrored, setIsMirrored] = useState(false); // Default to normal (not mirrored)
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const pausedScrollPositionRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate estimated total time in seconds
  const estimatedTotalTime = (totalWords / (wpm || 150)) * 60;

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Actually start/resume playback (no countdown involved)
  const beginPlayback = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsPlaying(true);
  }, []);

  // Cancel an in-progress countdown, leaving playback paused at the start
  const cancelCountdown = useCallback(() => {
    clearCountdownTimer();
    setCountdown(null);
  }, [clearCountdownTimer]);

  // Start a pre-roll countdown, then begin playback. 0/negative seconds skips straight to playback.
  const startWithCountdown = useCallback(
    (seconds: number) => {
      clearCountdownTimer();
      if (!seconds || seconds <= 0) {
        setCountdown(null);
        beginPlayback();
        return;
      }

      // One-second countdown chain; calls beginPlayback when it reaches 0.
      const tick = (remaining: number) => {
        countdownTimerRef.current = setTimeout(() => {
          if (remaining <= 1) {
            setCountdown(null);
            beginPlayback();
          } else {
            setCountdown(remaining - 1);
            tick(remaining - 1);
          }
        }, 1000);
      };

      setCountdown(seconds);
      tick(seconds);
    },
    [beginPlayback, clearCountdownTimer]
  );

  // Clean up any pending countdown timer on unmount
  useEffect(() => {
    return () => {
      clearCountdownTimer();
    };
  }, [clearCountdownTimer]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (countdown !== null) {
      // Counting down - cancel it and stay paused at the start
      cancelCountdown();
      return;
    }
    if (isPlaying) {
      // Pausing - save current scroll position
      pausedScrollPositionRef.current = scrollPosition;
      setIsPlaying(false);
      return;
    }
    // Starting/resuming playback
    const atStart = scrollPosition === 0 && pausedScrollPositionRef.current === 0;
    if (atStart && countdownSeconds > 0) {
      startWithCountdown(countdownSeconds);
    } else {
      beginPlayback();
    }
  }, [countdown, isPlaying, scrollPosition, countdownSeconds, cancelCountdown, startWithCountdown, beginPlayback]);

  // Adjust speed
  const adjustSpeed = useCallback((delta: number) => {
    setSpeedMultiplier((prev) => {
      const newSpeed = Math.max(0.5, Math.min(2.0, prev + delta));
      return Math.round(newSpeed * 10) / 10;
    });
  }, []);

  // Adjust text size
  const adjustTextSize = useCallback((delta: number) => {
    setTextSize((prev) => Math.max(1, Math.min(7, prev + delta)));
  }, []);

  // Toggle mirror mode
  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  // Reset to beginning
  const reset = useCallback(() => {
    clearCountdownTimer();
    setCountdown(null);
    setIsPlaying(false);
    setCurrentLineIndex(0);
    setScrollPosition(0);
    setElapsedTime(0);
    startTimeRef.current = null;
    pausedScrollPositionRef.current = 0;
  }, [clearCountdownTimer]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInputField) {
        return; // Let the input field handle the key
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          e.preventDefault();
          if (onExit) onExit();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustSpeed(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustSpeed(-0.1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          adjustTextSize(1);
          break;
        case '-':
        case '_':
          e.preventDefault();
          adjustTextSize(-1);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMirror();
          break;
        case 'Home':
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, adjustSpeed, adjustTextSize, toggleMirror, reset, onExit]);

  // Auto-scroll and time tracking
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      if (startTimeRef.current !== null) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        // Calculate scroll position based on time and speed
        // Pixels per second = base scroll rate * speed multiplier
        const baseScrollRate = 30; // pixels per second at 1x speed
        const scrollRate = baseScrollRate * speedMultiplier;
        
        // Start from paused position and add new scroll distance
        const newScrollDistance = elapsed * scrollRate;
        setScrollPosition(pausedScrollPositionRef.current + newScrollDistance);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speedMultiplier]);

  return {
    isPlaying,
    currentLineIndex,
    scrollPosition,
    speedMultiplier,
    textSize,
    isMirrored,
    elapsedTime,
    estimatedTotalTime,
    countdown,
    togglePlayPause,
    adjustSpeed,
    adjustTextSize,
    toggleMirror,
    reset,
    setCurrentLineIndex,
    startWithCountdown,
    cancelCountdown,
  };
};
