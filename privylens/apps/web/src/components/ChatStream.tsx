"use client";
import React from 'react';
import { ImagePreviewDialog } from './ImagePreviewDialog';

export type Message =
  | { id: string; role: 'user' | 'system'; type: 'text'; masked: string; original?: string }
  | { id: string; role: 'user' | 'system'; type: 'image'; originalThumbUrl: string; redactedUrl: string };

export function ChatStream({ messages }: { messages: Message[] }) {
  const [preview, setPreview] = React.useState<string | null>(null);
  return (
    <div className="flex-1 overflow-y-auto space-y-3 py-2">
      {messages.map((m) => (
        <div key={m.id} className="flex">
          <div className="rounded-xl border p-3 shadow-sm max-w-[85%]">
            {m.type === 'text' ? (
              <p className="whitespace-pre-wrap break-words">{m.masked}</p>
            ) : (
              <button
                className="block focus:outline-none"
                onClick={() => setPreview(m.redactedUrl)}
                aria-label="Open redacted image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.originalThumbUrl} alt="uploaded" className="h-32 w-auto rounded-lg" />
              </button>
            )}
          </div>
        </div>
      ))}
      <ImagePreviewDialog open={!!preview} onOpenChange={() => setPreview(null)} url={preview ?? ''} />
    </div>
  );
}

