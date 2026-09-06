'use client';

import React, { useMemo, useState } from 'react';
import { getPronunciation } from '@/utils/pronunciation';
import { PronunciationTooltip } from './PronunciationTooltip';

interface ScriptTextDisplayProps {
  text: string;
  className?: string;
  /** Called whenever a dictionary word is opened. */
  onLookup?: (word: string, pronunciation: string) => void;
}

interface TooltipState {
  id: string;
  word: string;
  pronunciation: string;
  position: { x: number; y: number };
}

interface Token {
  type: 'word' | 'separator';
  content: string;
  /** Set when the word is in the dictionary. */
  pronunciation?: string;
}

/**
 * Renders the script with every dictionary word clickable for an ARPABET lookup.
 * Paragraphs and line breaks are preserved and text stays selectable.
 */
export const ScriptTextDisplay = ({ text, className = '', onLookup }: ScriptTextDisplayProps) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const parsedContent = useMemo(() => {
    if (!text) return [];

    return text.split(/\n\n+/).map((paragraph, pIndex) => ({
      key: `p-${pIndex}`,
      lines: paragraph.split(/\n/).map((line, lIndex) => {
        const tokens: Token[] = [];
        const regex = /(\b[\w']+\b)|([^\w']+)/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
          if (match[1]) {
            const pronunciation = getPronunciation(match[1]).pronunciation;
            tokens.push({
              type: 'word',
              content: match[1],
              pronunciation: pronunciation ?? undefined,
            });
          } else if (match[2]) {
            tokens.push({ type: 'separator', content: match[2] });
          }
        }

        return { key: `l-${pIndex}-${lIndex}`, tokens };
      }),
    }));
  }, [text]);

  const openWord = (
    id: string,
    token: Token,
    element: HTMLElement,
  ) => {
    if (!token.pronunciation) return;
    const result = getPronunciation(token.content);
    const pronunciation = result.pronunciation ?? token.pronunciation;
    const rect = element.getBoundingClientRect();
    setTooltip({
      id,
      word: result.text,
      pronunciation,
      position: { x: rect.left, y: rect.bottom },
    });
    onLookup?.(result.text, pronunciation);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="text-[15px] leading-[1.9] whitespace-pre-wrap text-body">
        {parsedContent.map((paragraph) => (
          <div key={paragraph.key} className="mb-4 last:mb-0">
            {paragraph.lines.map((line, lineIndex) => (
              <React.Fragment key={line.key}>
                {line.tokens.map((token, tokenIndex) => {
                  const id = `${line.key}-${tokenIndex}`;

                  if (token.type !== 'word' || !token.pronunciation) {
                    return <span key={id}>{token.content}</span>;
                  }

                  const selected = tooltip?.id === id;

                  return (
                    <span
                      key={id}
                      role="button"
                      tabIndex={0}
                      title={`Pronunciation for ${token.content}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openWord(id, token, event.currentTarget);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openWord(id, token, event.currentTarget);
                        }
                      }}
                      className={`cursor-pointer ${
                        selected
                          ? 'bg-ink text-panel'
                          : 'hover:bg-page hover:shadow-[0_1px_0_var(--line-strong)]'
                      }`}
                    >
                      {token.content}
                    </span>
                  );
                })}
                {lineIndex < paragraph.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <PronunciationTooltip
          word={tooltip.word}
          pronunciation={tooltip.pronunciation}
          position={tooltip.position}
          onClose={() => setTooltip(null)}
        />
      )}
    </div>
  );
};
