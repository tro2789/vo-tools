# Script Comparison Feature - Testing Guide

## Feature Overview
The script comparison feature allows voice actors to compare original and revised scripts side-by-side with visual difference highlighting.

## How to Test

### 1. Access the Application
Navigate to `http://localhost:3010` in your browser.

### 2. Test Single Mode (Default)
- You should see a single text editor with word count and time estimate on the right
- Type or paste any script to see the word count and reading time update in real-time
- Adjust the WPM slider to see time estimates change

### 3. Switch to Comparison Mode
- Click the "Single Mode" button in the top-right (next to the theme toggle)
- The button should change to "Compare Mode" with a blue background
- The layout should switch to show:
  - Three stat cards at the top (Original, Difference, Revised)
  - A WPM slider
  - Two side-by-side text editors

### 4. Test Script Comparison

#### Example Test Scripts:

**Original Script:**
```
Hello everyone. Today we're going to discuss the importance of staying hydrated. Drinking 8 glasses of water per day can help improve your health. Remember to drink regularly throughout the day.
```

**Revised Script:**
```
Hello everyone. Today we're going to discuss the importance of proper hydration. Drinking 6 to 8 glasses of water daily can significantly improve your health and energy levels. Remember to drink regularly throughout the day.
```

#### What to Look For:
1. **Paste the original script** into the left editor
2. **Paste the revised script** into the right editor
3. **Visual Highlights:**
   - Green highlighting on ADDED text (new words in revised)
   - Red highlighting with strikethrough on REMOVED text (deleted from original)
   - Regular text for UNCHANGED portions

4. **Stats Validation:**
   - Original word count should be calculated
   - Revised word count should be calculated
   - Difference should show the delta (e.g., "+5" or "-3" words)
   - Time estimates should reflect the word counts at the current WPM
   - The difference card should show time change in seconds

### 5. Test Edge Cases

#### Empty Scripts:
- Both empty: should show 0 words
- One empty: should highlight all text as added/removed

#### Identical Scripts:
- Same text in both: should show no highlights (all unchanged)
- Difference should be 0 words

#### Number Expansion:
- Try "$10,000" in the script
- Should count as "10000 dollars" (2 words in spoken form)

### 6. Test Responsiveness
- Resize browser window to test mobile/tablet layouts
- Verify side-by-side layout stacks vertically on smaller screens
- Check that all elements remain accessible

### 7. Switch Back to Single Mode
- Click "Compare Mode" button to return to single mode
- Should preserve the original script content
- Layout should return to original single-editor view

## Expected Features

✅ Toggle between single and comparison modes  
✅ Side-by-side script editors in comparison mode  
✅ Real-time difference highlighting (green for added, red for removed)  
✅ Word count comparison with delta calculation  
✅ Time estimate comparison  
✅ Visual legend explaining the color coding  
✅ Adjustable WPM slider affects both scripts  
✅ Dark mode support throughout  

## Technical Details

### Files Modified/Created:
1. `utils/textComparison.ts` - Text diff algorithm using LCS
2. `components/ScriptCalculator.tsx` - Updated UI with comparison mode

### Key Technologies:
- Longest Common Subsequence (LCS) algorithm for diff calculation
- Token-based comparison (word + whitespace)
- React state management for mode switching
- Tailwind CSS for highlighting styles
