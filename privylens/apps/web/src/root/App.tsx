import React, { useState } from 'react';
import { PolicyPopover } from '@/components/PolicyPopover';
import { ChatComposer } from '@/components/ChatComposer';
import { ChatStream, Message } from '@/components/ChatStream';
//import { ImageDropzone } from '@/components/ImageDropzone';
import FaceRedactor from '@/components/FaceRedactor';

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
    <div className="flex h-screen bg-[#212121] text-gray-100">
      {/* Sidebar - ChatGPT style */}
      <div className="w-64 bg-[#171717] border-r border-gray-600 flex flex-col">
        <div className="p-4 border-b border-gray-600">
          <h1 className="text-xl font-semibold text-white">PrivyLens</h1>
          <p className="text-sm text-gray-400 mt-1">Privacy-first redaction</p>
        </div>

        <div className="flex-1 p-4">
          <div className="space-y-4">
            <section className="bg-[#2f2f2f] rounded-lg p-4 border border-gray-600">
              <h3 className="font-medium text-white mb-3">Privacy Settings</h3>
              <PolicyPopover policy={policy} onChange={onPolicyChange} />
            </section>

            <div className="text-xs text-gray-500 p-3">
              <p>✓ Client-side processing</p>
              <p>✓ No data sent to servers</p>
              <p>✓ Real-time redaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Full ChatGPT style */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-600 bg-[#2f2f2f] p-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-semibold text-white">Face & Privacy Redaction</h2>
            <p className="text-sm text-gray-400">
              Automatically blur faces and redact sensitive information
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-6xl mx-auto px-6 py-6">
            {/* Three-column layout - Face redaction now main focus */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
              {/* Main Face Redaction section - takes up 2 columns */}
              <div className="xl:col-span-7 flex flex-col bg-[#2f2f2f] rounded-lg border border-gray-600 overflow-hidden">
                <div className="p-4 border-b border-gray-600 bg-[#2a2a2a]">
                  <h3 className="font-semibold text-white">Face Redaction Studio</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload images to automatically detect and blur faces with precision
                  </p>
                </div>
                <div className="flex-1 p-6">
                  <FaceRedactor onImageReady={handleImageUploaded} />
                </div>
              </div>

              {/* Right panel - Text tools */}
              <div className="xl:col-span-5 flex flex-col space-y-6">
                {/* Text Redaction Chat */}
                <div className="bg-[#2f2f2f] rounded-lg border border-gray-600 flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-gray-600 bg-[#2a2a2a]">
                    <h3 className="font-semibold text-white">Text Redaction</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Type sensitive info - auto-redacted
                    </p>
                  </div>
                    <div className="flex h-screen bg-[#212121] max-h-[70vh] text-gray-100 overflow-y-auto ">
                      <ChatStream messages={messages} />
                   </div>
                </div>

                {/* Image Upload for Chat */}
                {/*<div className="bg-[#2f2f2f] rounded-lg border border-gray-600 overflow-hidden">
                  <div className="p-4 border-b border-gray-600 bg-[#2a2a2a]">
                    <h3 className="font-semibold text-white">Add to Chat</h3>
                    <p className="text-xs text-gray-400 mt-1">Upload images for chat</p>
                  </div>
                  <div className="p-4">
                    <ImageDropzone onUploaded={handleImageUploaded} policy={policy} />
                  </div>
                </div>*/}
              </div>
            </div>
          </div>
        </div>

        {/* Input area - ChatGPT style */}
        <div className="border-t border-gray-600 bg-transparent p-4">
          <div className="max-w-4xl mx-auto">
            <ChatComposer
              onRedacted={handleRedactedText}
              onImageAttached={handleImageUploaded}
              policy={policy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
