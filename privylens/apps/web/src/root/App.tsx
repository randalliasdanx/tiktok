import React, { useState } from 'react';
import { PolicyPopover } from '@/components/PolicyPopover';
import { ChatComposer } from '@/components/ChatComposer';
import { ChatStream, Message } from '@/components/ChatStream';
import FaceRedactor from '@/components/FaceRedactor';
import { HighTechBackground } from '@/components/HighTechBackground';
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
    // Add user message with redaction animation
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      masked,
      original,
      spans,
      showAnimation: spans.length > 0, // Only animate if there are redactions
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
          const urlToUse = msg.choice === 'original' ? msg.originalThumbUrl : msg.redactedUrl;
          return await blobUrlToBase64(urlToUse);
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

  const handleImageUploaded = async (
    originalThumbUrl: string,
    redactedUrl: string,
    choice: 'original' | 'redacted' = 'redacted',
  ) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'image',
      originalThumbUrl,
      redactedUrl,
      choice,
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
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      <HighTechBackground />
      {/* Sidebar - ChatGPT style */}
      <div className="w-64 bg-[#0a0a0a]/90 backdrop-blur-xl border-r border-gray-800/50 flex flex-col relative z-10">
        <div className="p-4 border-b border-gray-800/50">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-in slide-in-from-left duration-500">
            PrivyLens
          </h1>
          <p className="text-sm text-gray-400 mt-1 animate-in slide-in-from-left duration-500 delay-100">
            Privacy-first AI chat
          </p>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <section className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-2xl hover:shadow-blue-500/10 transition-all animate-in slide-in-from-left duration-500 delay-200">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-green-400/50 shadow-lg"></span>
              Privacy Settings
            </h3>
            <PolicyPopover policy={policy} onChange={onPolicyChange} />
          </section>

          <div className="text-xs text-gray-500 p-3 space-y-3 animate-in slide-in-from-left duration-500 delay-300">
            <div className="flex items-center transition-all duration-300 hover:text-blue-400">
              <span className="w-1 h-1 bg-blue-400 rounded-full mr-3 animate-pulse"></span>
              <span className="flex-1">Client-side processing</span>
              <div className="w-2 h-2 bg-blue-400/20 rounded-full animate-ping"></div>
            </div>
            <div className="flex items-center transition-all duration-300 hover:text-purple-400">
              <span className="w-1 h-1 bg-purple-400 rounded-full mr-3 animate-pulse"></span>
              <span className="flex-1">Auto redaction</span>
              <div className="w-2 h-2 bg-purple-400/20 rounded-full animate-ping"></div>
            </div>
            <div className="flex items-center transition-all duration-300 hover:text-green-400">
              <span className="w-1 h-1 bg-green-400 rounded-full mr-3 animate-pulse"></span>
              <span className="flex-1">Image privacy</span>
              <div className="w-2 h-2 bg-green-400/20 rounded-full animate-ping"></div>
            </div>
          </div>

          <button
            className="w-full text-left px-3 py-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 hover:from-gray-700/70 hover:to-gray-600/70 transition-all text-gray-300 hover:text-white transform hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-xl animate-in slide-in-from-left duration-500 delay-400"
            onClick={() => navigate('/history')}
          >
            <div className="flex items-center">
              <span className="text-lg mr-3">📚</span>
              <span>My History</span>
              <div className="ml-auto w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
          </button>

          {/* Status indicator */}
          <div className="mt-auto p-3 rounded-xl bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 animate-in slide-in-from-left duration-500 delay-500">
            <div className="flex items-center text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-green-400/50 shadow-lg"></div>
              <span>System Active</span>
              <div className="ml-auto text-green-300">●</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area - Full ChatGPT style */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a]/90 backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl p-4 animate-in slide-in-from-top duration-500">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3 animate-pulse shadow-blue-500/50 shadow-lg"></span>
              PrivyLens Chat
              <div className="ml-auto flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Online</span>
              </div>
            </h2>
            <p className="text-sm text-gray-400 animate-in slide-in-from-top duration-500 delay-100">
              Your messages and images are automatically redacted for privacy
            </p>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto animate-in slide-in-from-bottom duration-500 delay-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <ChatStream messages={messages} />
          </div>
        </div>

        {/* Input Area - ChatGPT style with + button */}
        <div className="border-t border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl p-4 animate-in slide-in-from-bottom duration-500 delay-300">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Glow effect behind input */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl"></div>
              <div className="relative">
                <ChatComposer
                  onRedacted={(masked, spans, original) => {
                    void handleRedactedText(masked, spans, original);
                  }}
                  onImageAttached={(o, r, choice) => {
                    void handleImageUploaded(o, r, choice);
                  }}
                  policy={policy}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
