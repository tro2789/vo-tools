'use client';

import React, { useState, useMemo } from 'react';
import { getPronunciation } from '@/utils/pronunciation';
import { PronunciationTooltip } from './PronunciationTooltip';

interface ScriptTextDisplayProps {
  text: string;
  className?: string;
}

interface TooltipState {
  word: string;
  pronunciation: string;
  position: { x: number; y: number };
}

/**
 * ScriptTextDisplay Component
 * 
 * Renders script text with clickable words for pronunciation lookup.
 * Designed for voice actors to quickly check pronunciations while reading.
 * 
 * Features:
 * - Each word is clickable to show pronunciation
 * - Preserves paragraphs and line breaks
 * - Doesn't interfere with text selection/copy-paste
 * - Memoized word parsing for performance
 * - Only shows pronunciation for words that exist in the dictionary
 * 
 * Implementation Notes:
 * - Words are wrapped in <span> elements with onClick handlers
 * - Whitespace and punctuation are preserved between words
 * - Tooltip positioning is handled automatically
 */
export const ScriptTextDisplay: React.FC<ScriptTextDisplayProps> = ({
  text,
  className = ''
}) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Parse text into paragraphs and words
  // Memoized to avoid re-parsing on every render
  const parsedContent = useMemo(() => {
    if (!text) return [];

    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((paragraph, pIndex) => {
      // Split by single newlines within paragraph
      const lines = paragraph.split(/\n/);

      return {
        key: `p-${pIndex}`,
        lines: lines.map((line, lIndex) => {
          // Tokenize line into words and non-words (spaces, punctuation)
          // Match words (sequences of letters, possibly with apostrophes)
          // and capture everything else as separators
          const tokens: Array<{ type: 'word' | 'separator'; content: string }> = [];
          const regex = /(\b[\w']+\b)|([^\w']+)/g;
          let match;

          while ((match = regex.exec(line)) !== null) {
            if (match[1]) {
              // It's a word
              tokens.push({ type: 'word', content: match[1] });
            } else if (match[2]) {
              // It's a separator (space, punctuation, etc.)
              tokens.push({ type: 'separator', content: match[2] });
            }
          }

          return {
            key: `l-${pIndex}-${lIndex}`,
            tokens
          };
        })
      };
    });
  }, [text]);

  // Handle word click
  const handleWordClick = (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();

    // Get pronunciation
    const result = getPronunciation(word);

    // Only show tooltip if pronunciation exists
    if (result.pronunciation) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        word: result.text,
        pronunciation: result.pronunciation,
        position: {
          x: rect.left,
          y: rect.bottom
        }
      });
    }
  };

  // Close tooltip
  const closeTooltip = () => {
    setTooltip(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Rendered script text */}
      <div className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
        {parsedContent.map((paragraph) => (
          <div key={paragraph.key} className="mb-4 last:mb-0">
            {paragraph.lines.map((line, lineIndex) => (
              <React.Fragment key={line.key}>
                {line.tokens.map((token, tokenIndex) => {
                  if (token.type === 'word') {
                    return (
                      <span
                        key={`${line.key}-${tokenIndex}`}
                        onClick={(e) => handleWordClick(token.content, e)}
                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-0.5 transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleWordClick(token.content, e as any);
                          }
                        }}
                      >
                        {token.content}
                      </span>
                    );
                  } else {
                    // Separator (spaces, punctuation, etc.)
                    return (
                      <span key={`${line.key}-${tokenIndex}`}>
                        {token.content}
                      </span>
                    );
                  }
                })}
                {lineIndex < paragraph.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>

      {/* Pronunciation tooltip */}
      {tooltip && (
        <PronunciationTooltip
          word={tooltip.word}
          pronunciation={tooltip.pronunciation}
          position={tooltip.position}
          onClose={closeTooltip}
        />
      )}
    </div>
  );
};
