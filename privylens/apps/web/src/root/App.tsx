import React, { useState } from 'react';
import { PolicyPopover } from '@/components/PolicyPopover';
import { ChatComposer } from '@/components/ChatComposer';
import { ChatStream, Message } from '@/components/ChatStream';
import FaceRedactor from '@/components/FaceRedactor';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/client'; // your client factory
import { saveTextRedaction, saveImageRedaction } from '@/lib/history';
import { streamLLMResponse, ChatMessage, blobUrlToBase64 } from '@/lib/api';

export function App() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [policy, setPolicy] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {} as any;
    try {
      const raw = localStorage.getItem('privylens-policy');
      return raw
        ? JSON.parse(raw)
        : { emails: true, phones: true, cards: true, faces: true, plates: true, ids: true };
    } catch {
      return { emails: true, phones: true, cards: true, faces: true, plates: true, ids: true };
    }
  });

  async function blobFromUrl(url: string) {
    const res = await fetch(url);
    return await res.blob();
  }

  const onPolicyChange = (p: Record<string, boolean>) => {
    setPolicy(p);
    try {
      localStorage.setItem('privylens-policy', JSON.stringify(p));
    } catch {}
  };

  const handleRedactedText = async (
    masked: string,
    spans: Array<{ start: number; end: number; label: string }>,
    original: string,
  ) => {
    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      masked,
      original,
    };
    setMessages((m) => [...m, userMsg]);

    // Prepare assistant message for streaming
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      type: 'text',
      masked: '',
      streaming: true,
    };
    setMessages((m) => [...m, assistantMsg]);

    // Get conversation history for API
    const conversationHistory: ChatMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.type === 'text' ? msg.masked : '[Image]',
    }));

    // Get images from recent messages
    const recentImages = messages
      .filter((msg) => msg.type === 'image')
      .slice(-3) // Last 3 images
      .map(async (msg) => {
        if (msg.type === 'image') {
          return await blobUrlToBase64(msg.redactedUrl);
        }
        return '';
      });

    const imageDataUrls = await Promise.all(recentImages);

    // Stream ChatGPT response
    await streamLLMResponse(
      masked,
      conversationHistory,
      imageDataUrls.filter(Boolean),
      (token: string) => {
        // Update assistant message with new token
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMsgId && msg.type === 'text'
              ? { ...msg, masked: msg.masked + token }
              : msg,
          ),
        );
      },
      () => {
        // Mark streaming as complete
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMsgId && msg.type === 'text' ? { ...msg, streaming: false } : msg,
          ),
        );
      },
      (error: string) => {
        // Handle error
        console.error('ChatGPT API error:', error);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMsgId && msg.type === 'text'
              ? { ...msg, masked: `Error: ${error}`, streaming: false }
              : msg,
          ),
        );
      },
    );
  };

  const handleImageUploaded = async (originalThumbUrl: string, redactedUrl: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'image',
      originalThumbUrl,
      redactedUrl,
    };
    setMessages((m) => [...m, msg]);

    try {
      const { data: { user } = { user: null } } = await supabase.auth.getUser();
      if (!user) return;

      await saveImageRedaction({
        userId: user.id,
        originalUrl: originalThumbUrl, // optional if you don’t save originals
        redactedUrl,
        facesCount: 0,
        saveOriginal: false,
      });
    } catch (e) {
      console.error('saveImageRedaction failed:', e);
    }
  };

  return (
  <div className="min-h-screen bg-[#0f1115] text-gray-100">
    <div className="mx-auto flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-[#111417] border-r border-[#2b2f36] flex flex-col">
        <div className="p-5 border-b border-[#2b2f36]">
          <h1 className="text-xl font-semibold text-white">PrivyLens</h1>
          <p className="text-sm text-gray-400 mt-1">Privacy-first redaction</p>
        </div>

        <div className="flex-1 p-4">
          <div className="space-y-4">
            <section className="bg-[#151a20] rounded-2xl p-4 border border-[#2b2f36]">
              <h3 className="font-medium text-white mb-3">Privacy Settings</h3>
              <PolicyPopover policy={policy} onChange={onPolicyChange} />
            </section>

            <div className="text-xs text-gray-500 p-3 leading-5">
              <p>✓ Client-side processing</p>
              <p>✓ No data sent to servers</p>
              <p>✓ Real-time redaction</p>
            </div>

            <button
              className="inline-flex items-center ml-3 gap-2 self-start
                        rounded-lg bg-[#404040] border border-[#2b2f36]
                        text-gray-100 px-3 py-2 text-sm
                        hover:bg-[#4a4a4a] transition-colors"
              onClick={() => navigate('/history')}
            >
              My Image History
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-[#2b2f36] bg-[#0f1115]/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Face &amp; Privacy Redaction</h2>
            <p className="text-sm text-gray-400">
              Automatically blur faces and redact sensitive information
            </p>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-hidden">
          <div className="h-full max-w-6xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
              {/* Face Redaction */}
              <section className="xl:col-span-7 flex flex-col rounded-2xl bg-[#151a20] border border-[#2b2f36] overflow-hidden">
                <div className="p-4 border-b border-[#2b2f36] bg-[#131820]">
                  <h3 className="font-semibold text-white">Face Redaction Studio</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload images to automatically detect and blur faces with precision
                  </p>
                </div>
                <div className="flex-1 p-6">
                  <FaceRedactor onImageReady={handleImageUploaded} />
                </div>
              </section>

              {/* Text Redaction */}
              <section className="xl:col-span-5 flex flex-col space-y-6">
                <div className="rounded-2xl bg-[#151a20] border border-[#2b2f36] flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-[#2b2f36] bg-[#131820] flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Text Redaction</h3>
                      <p className="text-xs text-gray-400 mt-1">Type sensitive info – auto-redacted</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#10a37f] hover:bg-[#0d8a6b] text-white"
                      onClick={() => (window as any).exportMasked?.()}
                      title="Export .txt"
                    >
                      Export .txt
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-3">
                      <ChatStream messages={messages} />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

        {/* Composer */}
        <footer className="border-t border-[#2b2f36] bg-[#111417]">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <ChatComposer
              onRedacted={(masked, spans, original) => {
                void handleRedactedText(masked, spans, original);
              }}
              onImageAttached={(o, r) => {
                void handleImageUploaded(o, r);
              }}
              policy={policy}
            />
          </div>
        </footer>
      </main>
    </div>
  </div>
);
}
