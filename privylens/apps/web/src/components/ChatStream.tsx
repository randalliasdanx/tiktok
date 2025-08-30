'use client';
import React from 'react';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { RedactedText } from './RedactedText';
import { AnimatedTextRedaction, StaticRedactedText } from './AnimatedTextRedaction';

export type Message =
  | {
      id: string;
      role: 'user' | 'assistant';
      type: 'text';
      masked: string;
      original?: string;
      streaming?: boolean;
      spans?: Array<{ start: number; end: number; label: string }>;
      showAnimation?: boolean;
    }
  | {
      id: string;
      role: 'user' | 'assistant';
      type: 'image';
      originalThumbUrl: string;
      redactedUrl: string;
      choice?: 'original' | 'redacted';
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <svg
                  className="w-10 h-10 text-white"
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
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
                  Welcome to PrivyLens
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Start chatting with AI while keeping your sensitive information private. Your
                  messages are automatically scanned and redacted in real-time.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full">
                  📧 Email Protection
                </span>
                <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full">
                  📱 Phone Privacy
                </span>
                <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full">
                  💳 Credit Card Safety
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sticky toolbar */}
            <div className="sticky top-0 z-10 mb-6">
              <div className="flex justify-center">
                <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-600 rounded-full px-4 py-2 shadow-lg">
                  <button
                    onClick={exportTxt}
                    className="text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                    aria-label="Export conversation as .txt"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-8">
              {messages.map((m, index) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-4 animate-in slide-in-from-bottom duration-300`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Avatar */}
                  <div
                    className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg
                    ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }
                  `}
                  >
                    {m.role === 'user' ? (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 max-w-3xl">
                    {/* Role Label */}
                    <div className="text-xs text-gray-400 mb-2 font-medium">
                      {m.role === 'user' ? 'You' : 'PrivyLens AI'}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`
                      rounded-2xl p-4 shadow-lg border transition-all duration-200 hover:shadow-xl
                      ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
                          : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                      }
                    `}
                    >
                      {m.type === 'text' ? (
                        <div className="prose prose-invert max-w-none">
                          <div className="text-white leading-relaxed">
                            {m.role === 'user' && m.spans && m.showAnimation && m.original ? (
                              <AnimatedTextRedaction
                                originalText={m.original}
                                maskedText={m.masked}
                                spans={m.spans}
                                onComplete={() => {
                                  // Optional: Mark animation as complete
                                }}
                              />
                            ) : m.role === 'user' && m.spans && m.spans.length > 0 ? (
                              <StaticRedactedText maskedText={m.masked} spans={m.spans} />
                            ) : (
                              <div className="whitespace-pre-wrap break-words">
                                {m.masked}
                                {m.streaming && (
                                  <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 animate-pulse"></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-300 font-medium flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Image Attached
                          </div>
                          <div className="space-y-2">
                            <div className="relative group">
                              <img
                                src={m.choice === 'original' ? m.originalThumbUrl : m.redactedUrl}
                                alt={m.choice === 'original' ? 'Original image' : 'Redacted image'}
                                className="w-full h-40 object-cover rounded-xl border border-gray-600 transition-transform group-hover:scale-105"
                              />
                              <div
                                className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded ${
                                  m.choice === 'original' ? 'bg-red-500/90' : 'bg-green-500/90'
                                }`}
                              >
                                {m.choice === 'original' ? 'Original' : '✓ Protected'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setPreview(m)}
                            className="w-full mt-3 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Image
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

      {/* Image Preview Dialog */}
      {preview && (
        <ImagePreviewDialog
          open={!!preview}
          onOpenChange={() => setPreview(null)}
          originalUrl={
            preview.type === 'image' && preview.choice === 'original'
              ? preview.originalThumbUrl
              : ''
          }
          redactedUrl={
            preview.type === 'image' && preview.choice !== 'original' ? preview.redactedUrl : ''
          }
        />
      )}
    </div>
  );
}
