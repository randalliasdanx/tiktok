'use client';
import React from 'react';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { RedactedText } from './RedactedText';

export type Message =
  | {
      id: string;
      role: 'user' | 'assistant';
      type: 'text';
      masked: string;
      original?: string;
      streaming?: boolean;
    }
  | {
      id: string;
      role: 'user' | 'assistant';
      type: 'image';
      originalThumbUrl: string;
      redactedUrl: string;
    };

export function ChatStream({ messages }: { messages: Message[] }) {
  const [preview, setPreview] = React.useState<Message | null>(null);

  // auto-scroll to bottom when messages change
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ----- Export to .txt -----
  const serializeMessagesToTxt = (msgs: Message[]) => {
    return msgs
      .map((m, i) => {
        const header = `#${i + 1} [${m.role.toUpperCase()}]`;
        if (m.type === 'text') return `${header}\n${m.masked}`;
        return `${header}\n[image attached]`;
      })
      .join('\n\n---\n\n');
  };

  const exportTxt = () => {
    const content = serializeMessagesToTxt(messages);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privylens-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  // --------------------------

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4">
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
                <h3 className="text-lg font-medium text-white mb-2">
                  Start a private conversation
                </h3>
                <p className="text-gray-400 text-sm">
                  Type sensitive information below and it will be automatically redacted
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sticky toolbar */}
            <div className="sticky top-0 z-10 mb-3">
              <div className="flex justify-end gap-2 rounded-md border border-gray-700 bg-[#2a2a2a]/80 backdrop-blur px-2 py-1.5">
                <button
                  onClick={exportTxt}
                  className="text-xs px-3 py-1.5 rounded-md border border-gray-600 bg-[#242424] hover:bg-[#1f1f1f] text-gray-100 active:scale-[.98]"
                  aria-label="Export conversation as .txt"
                >
                  Export .txt
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {messages.map((m) => (
                <div key={m.id} className="flex">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      m.role === 'user' ? 'bg-[#10a37f]' : 'bg-[#6366f1]'
                    }`}
                  >
                    <span className="text-white text-sm font-medium">
                      {m.role === 'user' ? 'U' : 'AI'}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-gray-100">
                      {m.type === 'text' ? (
                        <div className="prose prose-invert max-w-none">
                          <p className="whitespace-pre-wrap break-words">
                            <RedactedText text={m.masked} />
                            {m.type === 'text' && m.streaming && (
                              <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse"></span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-300 font-medium">Image Comparison</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-400 mb-2">Original</div>
                              <img
                                src={m.originalThumbUrl}
                                alt="Original image"
                                className="w-full h-32 object-cover rounded-lg border border-gray-600"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-2">Privacy Protected</div>
                              <img
                                src={m.redactedUrl}
                                alt="Redacted image"
                                className="w-full h-32 object-cover rounded-lg border border-gray-600"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setPreview(m)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View full size comparison →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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
