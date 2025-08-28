import React, { useState } from 'react';
import { PolicyPopover } from '@/components/PolicyPopover';
import { ChatComposer } from '@/components/ChatComposer';
import { ChatStream, Message } from '@/components/ChatStream';
import { ImageDropzone } from '@/components/ImageDropzone';

export function App() {
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

  const onPolicyChange = (p: Record<string, boolean>) => {
    setPolicy(p);
    try {
      localStorage.setItem('privylens-policy', JSON.stringify(p));
    } catch {}
  };

  const handleRedactedText = (
    masked: string,
    spans: Array<{ start: number; end: number; label: string }>,
    original: string,
  ) => {
    const msg: Message = { id: crypto.randomUUID(), role: 'user', type: 'text', masked, original };
    setMessages((m) => [...m, msg]);
  };

  const handleImageUploaded = (originalThumbUrl: string, redactedUrl: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'image',
      originalThumbUrl,
      redactedUrl,
    };
    setMessages((m) => [...m, msg]);
  };

  return (
    <div className="flex flex-col h-screen">
      <nav className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">PrivyLens</div>
          <PolicyPopover policy={policy} onChange={onPolicyChange} />
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <div className="flex flex-col min-h-0">
          <ChatStream messages={messages} />
        </div>
        <div className="min-h-0">
          <ImageDropzone onUploaded={handleImageUploaded} policy={policy} />
        </div>
      </main>

      <div className="sticky bottom-0 w-full bg-white/80 backdrop-blur border-t">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <ChatComposer onRedacted={handleRedactedText} policy={policy} />
        </div>
      </div>
    </div>
  );
}
