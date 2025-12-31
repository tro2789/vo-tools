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
}

export interface UseTeleprompterOptions {
  wpm: number;
  totalWords: number;
  onExit?: () => void;
}

/**
 * Custom hook for teleprompter functionality
 * Handles auto-scrolling, timing, and keyboard controls
 */
export const useTeleprompter = ({
  wpm,
  totalWords,
  onExit,
}: UseTeleprompterOptions) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [textSize, setTextSize] = useState(3); // Default to large (3)
  const [isMirrored, setIsMirrored] = useState(false); // Default to normal (not mirrored)
  const [elapsedTime, setElapsedTime] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const pausedScrollPositionRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate estimated total time in seconds
  const estimatedTotalTime = (totalWords / (wpm || 150)) * 60;

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const newState = !prev;
      if (newState) {
        // Starting/resuming playback - reset timer to 0
        startTimeRef.current = Date.now();
      } else {
        // Pausing - save current scroll position
        pausedScrollPositionRef.current = scrollPosition;
      }
      return newState;
    });
  }, [scrollPosition]);

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
    setIsPlaying(false);
    setCurrentLineIndex(0);
    setScrollPosition(0);
    setElapsedTime(0);
    startTimeRef.current = null;
    pausedScrollPositionRef.current = 0;
  }, []);

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
    togglePlayPause,
    adjustSpeed,
    adjustTextSize,
    toggleMirror,
    reset,
    setCurrentLineIndex,
  };
};
