# Inline Pronunciation Feature

## Overview

The Script Analysis tool now includes an inline pronunciation lookup feature, designed specifically for professional voice actors to quickly check word pronunciations during script preparation.

## Features

### ✅ Core Functionality
- **Click-to-Reveal Pronunciation**: Click any word in your script to see its phonetic pronunciation
- **ARPABET Notation**: Industry-standard phonetic notation used by voice actors and linguists
- **134,000+ Words**: Powered by the CMU Pronouncing Dictionary
- **Offline Operation**: No external API calls - works completely offline
- **Fast Performance**: Client-side dictionary lookup with in-memory caching

### ✅ User Experience
- **Toggle View Modes**: Switch between Edit mode and Pronunciation mode
- **Subtle UI**: Professional, non-intrusive interface that doesn't disrupt workflow
- **Keyboard Accessible**: Full keyboard navigation support (Tab, Enter, Escape)
- **Copy to Clipboard**: One-click copy of pronunciation
- **Auto-positioning**: Tooltips automatically adjust to stay within viewport

### ✅ Integration
- **Single Mode**: Available in the main script editor
- **Comparison Mode**: Available in both Original and Revised script editors
- **No Breaking Changes**: Existing functionality remains unchanged

## How to Use

### 1. Enter Script Text
Type or paste your script into the Script Analysis editor as usual.

### 2. Switch to Pronunciation Mode
Click the **Pronunciation** button in the editor toolbar (appears once you have text).

### 3. Click Words
Click any word to see its pronunciation in a tooltip:
- **Word**: The clicked word
- **Pronunciation**: ARPABET phoneme sequence (e.g., "hello" → "hh-ah-l-ow")
- **Copy Button**: Click to copy pronunciation to clipboard

### 4. Return to Edit Mode
Click the **Edit** button to return to editing your script.

## Technical Details

### Architecture

**Components:**
- `ScriptEditorWithPronunciation` - Wrapper component with mode toggle
- `ScriptTextDisplay` - Renders clickable word spans
- `PronunciationTooltip` - Shows pronunciation in a tooltip

**Utilities:**
- `pronunciation.ts` - Core pronunciation lookup logic with caching

**Dependencies:**
- `cmu-pronouncing-dictionary` (npm) - 134,000+ word pronunciation database

### Performance Optimizations

1. **Memoized Parsing**: Text is parsed into words only when changed
2. **In-Memory Cache**: Pronunciation lookups are cached to avoid repeated dictionary access
3. **Lazy Word Wrapping**: Words are only wrapped in clickable spans when in pronunciation mode
4. **Smart Rendering**: Only shows pronunciation mode when text is present

### ARPABET Notation

ARPABET is a phonetic notation developed by Carnegie Mellon University. It represents:

- **Vowels**: AH, AE, AA, etc.
- **Consonants**: P, B, T, D, K, G, etc.
- **Stress**: 0 (no stress), 1 (primary), 2 (secondary) - removed in display for clarity

Example pronunciations:
- "actor" → "ae-k-t-er"
- "microphone" → "m-ay-k-r-ah-f-ow-n"
- "pronunciation" → "p-r-ah-n-ah-n-s-iy-ey-sh-ah-n"

### Edge Cases Handled

1. **Numbers**: No pronunciation (as designed)
2. **Punctuation**: Stripped before lookup
3. **Capitalization**: Normalized to uppercase for lookup
4. **Contractions**: Handles apostrophes (e.g., "it's", "don't")
5. **Possessives**: Attempts base word lookup (e.g., "actor's" → "actor" + 's')
6. **Unknown Words**: No tooltip shown (fail silently)
7. **Multi-word Selection**: Shows pronunciation for each word if available

## Future Enhancements (Not Implemented)

Potential future additions could include:

- **IPA Support**: Add International Phonetic Alphabet as an alternative to ARPABET
- **Audio Playback**: Text-to-speech pronunciation samples
- **Custom Dictionary**: Allow users to add custom pronunciations
- **Highlight Unknown Words**: Visual indicator for words without pronunciation
- **Forvo Integration**: Link to community-sourced audio pronunciations
- **Stress Pattern Display**: Show primary/secondary stress markers as an option

## Testing

The feature has been tested with:
- ✅ Large scripts (performance remains smooth)
- ✅ Single-word lookup
- ✅ Multi-paragraph text
- ✅ Comparison mode (both editors)
- ✅ Keyboard navigation
- ✅ Dark mode compatibility
- ✅ Mobile responsiveness

## Limitations

1. **English Only**: CMU dictionary only supports English words
2. **No Phrases**: Multi-word phrases show individual word pronunciations
3. **No Context Awareness**: Same spelling always returns same pronunciation (e.g., "read" present vs. past)
4. **No Syllable Breaks**: Pronunciations shown as phoneme sequences without syllable markers

## Files Modified/Created

### Created:
- `utils/pronunciation.ts` - Core pronunciation logic
- `components/pronunciation/PronunciationTooltip.tsx` - Tooltip component
- `components/pronunciation/ScriptTextDisplay.tsx` - Clickable text renderer
- `components/editor/ScriptEditorWithPronunciation.tsx` - Editor wrapper with mode toggle

### Modified:
- `components/ScriptCalculator.tsx` - Updated to use new editor component
- `package.json` - Added `cmu-pronouncing-dictionary` dependency

## Conclusion

The inline pronunciation feature adds significant value to voice actors' workflow by providing instant, offline access to word pronunciations without disrupting their script analysis process. The implementation is performant, accessible, and seamlessly integrated into the existing Script Analysis tool.
