# Teleprompter Feature

## Overview

The Teleprompter is a professional-grade, distraction-free scrolling display designed for voice actors performing in studio recording sessions. It provides smooth auto-scrolling with real-time speed adjustments and timing information.

## Features

### Core Functionality
- **Fullscreen Mode**: Distraction-free black background with large, readable text
- **Auto-Scroll**: Smooth automatic scrolling calibrated to reading speed (WPM)
- **Speed Control**: Real-time adjustment (0.5x - 2.0x) via keyboard or on-screen controls
- **Current Line Highlighting**: Visual indicator of the current reading position
- **Fade Effect**: Upcoming lines are dimmed for easier focus

### Timing Display
- **Elapsed Time**: Shows time since teleprompter started
- **Remaining Time**: Estimated time remaining based on WPM and total words
- **Speed Multiplier**: Current playback speed indicator

### Keyboard Controls
- **Space**: Play/Pause
- **Arrow Up**: Increase speed by 0.1x
- **Arrow Down**: Decrease speed by 0.1x
- **Home**: Reset to beginning
- **Esc**: Exit fullscreen and return to setup

### On-Screen Controls
Controls automatically hide after 2 seconds of no mouse movement during playback for a clean reading experience.

## Usage

### Standalone Mode
1. Navigate to `/teleprompter`
2. Paste or type your script
3. Adjust WPM (words per minute) setting (default: 150)
4. Click "Start Teleprompter"

### Integration with Script Analysis
1. In Script Analysis tool, paste your script
2. Click the "Teleprompter" button in the header
3. Teleprompter launches with your script and current WPM settings

## Technical Implementation

### Architecture
```
/app/teleprompter/page.tsx              # Route
/components/teleprompter/
  ├── TeleprompterContainer.tsx         # Setup UI and state management
  └── TeleprompterDisplay.tsx           # Fullscreen display component
/hooks/useTeleprompter.ts               # Teleprompter logic and controls
```

### Key Components

#### TeleprompterContainer
- Manages script input and WPM settings
- Handles sessionStorage integration from Script Analysis
- Controls fullscreen mode toggle

#### TeleprompterDisplay
- Renders fullscreen teleprompter view
- Implements auto-hiding controls
- Displays timing information and current position
- Handles visual effects (highlighting, fading)

#### useTeleprompter Hook
- Manages playback state (playing/paused)
- Handles keyboard event listeners
- Calculates scroll position based on time and speed
- Tracks elapsed and estimated remaining time

### Script Analysis Integration

When launched from Script Analysis:
1. Current script and WPM are stored in `sessionStorage`
2. User is redirected to `/teleprompter`
3. TeleprompterContainer reads and clears sessionStorage
4. Teleprompter pre-loads with the script

### Scrolling Algorithm

```
scrollPosition = elapsedTime * baseScrollRate * speedMultiplier
```

- `baseScrollRate`: 30 pixels per second (at 1.0x speed)
- `speedMultiplier`: User-adjustable (0.5x - 2.0x)
- `elapsedTime`: Seconds since playback started

### Text Rendering

Lines are positioned with visual effects based on their distance from the viewport center:
- **Current Line** (within 80px of center): White, 5xl font
- **Upcoming Lines** (80-400px ahead): Gray, 4xl font  
- **Distant Lines**: Dark gray, 3xl font

## UX Considerations

### Studio-Friendly Design
- Black background reduces screen glare
- Large text for easy reading from distance
- Minimal UI that auto-hides during playback
- Keyboard-first operation (hands on mic, not mouse)

### Performance
- Uses `requestAnimationFrame` for smooth 60fps scrolling
- Memoized calculations to prevent unnecessary re-renders
- Efficient event listener cleanup

### Accessibility
- High contrast text (white on black)
- Large font sizes
- Clear keyboard shortcuts with on-screen hints
- Visual feedback for all interactive elements

## Future Enhancements (Not in MVP)

- Audio recording integration
- Pickup mode (start from specific line)
- Revision highlighting during re-takes
- Mirror mode for physical teleprompter hardware
- Custom color themes
- Font size adjustment
- Multiple column layouts for wide displays
