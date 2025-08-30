'use client';
import React from 'react';

interface RedactedTextProps {
  text: string;
}

interface Span {
  start: number;
  end: number;
  label: string;
}

export function RedactedText({ text }: RedactedTextProps) {
  // Parse [MASKED] tags and create animated spans
  const parseRedactedText = (text: string) => {
    const parts: { text: string; isRedacted: boolean }[] = [];
    const regex = /\[MASKED\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the masked part
      if (match.index > lastIndex) {
        parts.push({
          text: text.slice(lastIndex, match.index),
          isRedacted: false,
        });
      }

      // Add the masked part
      parts.push({
        text: match[0],
        isRedacted: true,
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.slice(lastIndex),
        isRedacted: false,
      });
    }

    return parts;
  };

  const parts = parseRedactedText(text);

  return (
    <span>
      {parts.map((part, index) => (
        <span
          key={index}
          className={
            part.isRedacted
              ? 'bg-gray-800 dark:bg-gray-300 text-gray-800 dark:text-gray-300 px-1 rounded animate-pulse transition-all duration-300'
              : ''
          }
        >
          {part.text}
        </span>
      ))}
    </span>
  );
}
