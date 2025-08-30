'use client';
import React from 'react';
import { ImagePreviewDialog } from './ImagePreviewDialog';

export type Message =
  | { id: string; role: 'user' | 'system'; type: 'text'; masked: string; original?: string }
  | {
      id: string;
      role: 'user' | 'system';
      type: 'image';
      originalThumbUrl: string;
      redactedUrl: string;
    };

export function ChatStream({ messages }: { messages: Message[] }) {
  const [preview, setPreview] = React.useState<Message | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#10a37f] rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Start a private conversation</h3>
              <p className="text-gray-400 text-sm">
                Type sensitive information below and it will be automatically redacted
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((m) => (
            <div key={m.id} className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-[#10a37f] rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-gray-100">
                  {m.type === 'text' ? (
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.masked}</p>
                    </div>
                  ) : (
                    <button
                      className="block focus:outline-none group"
                      onClick={() => setPreview(m)}
                      aria-label="View image comparison"
                    >
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.originalThumbUrl}
                          alt="uploaded"
                          className="h-32 w-auto rounded-lg border border-gray-600 transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">
                            Click to compare
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <ImagePreviewDialog
          open={!!preview}
          onOpenChange={() => setPreview(null)}
          originalUrl={preview.type === 'image' ? preview.originalThumbUrl : ''}
          redactedUrl={preview.type === 'image' ? preview.redactedUrl : ''}
        />
      )}
    </div>
  );
}
