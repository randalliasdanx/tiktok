import React, { useState } from 'react';
import { PolicyPopover } from '@/components/PolicyPopover';
import { ChatComposer } from '@/components/ChatComposer';
import { ChatStream, Message } from '@/components/ChatStream';
//import { ImageDropzone } from '@/components/ImageDropzone';
import FaceRedactor from '@/components/FaceRedactor';
import { streamLLMResponse, ChatMessage, blobUrlToBase64 } from '@/lib/api';

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

  const handleRedactedText = async (
    masked: string,
    spans: Array<{ start: number; end: number; label: string }>,
    original: string,
  ) => {
    console.log('handleRedactedText called with:', { masked, spans, original });
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      masked,
      original,
    };
    console.log('Adding message:', userMsg);

    // Add user message
    setMessages((m) => {
      const newMessages = [...m, userMsg];
      console.log('Updated messages:', newMessages);
      return newMessages;
    });

    // Create assistant message for streaming
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      type: 'text',
      masked: '',
      streaming: true,
    };

    setMessages((m) => [...m, assistantMsg]);

    // Build conversation history for API and collect recent images
    const conversationHistory: ChatMessage[] = [];

    // Get current messages synchronously - we need this for image collection
    const currentMessages = messages;
    console.log('📝 All current messages:', currentMessages);

    // Build conversation history from current messages (excluding the streaming assistant message)
    const historyMessages = currentMessages.filter(
      (msg) => msg.type === 'image' || (msg.type === 'text' && !msg.streaming),
    );

    console.log('📋 Filtered history messages:', historyMessages);

    for (const msg of historyMessages) {
      if (msg.type === 'text') {
        conversationHistory.push({
          role: msg.role,
          content: msg.masked,
        });
      }
    }

    // Collect recent image messages (last 5 for context)
    const imageMessages = historyMessages
      .filter((msg) => msg.type === 'image' && msg.role === 'user')
      .slice(-5);

    console.log('🖼️ Found image messages:', imageMessages);

    const recentImages: string[] = [];
    imageMessages.forEach((msg) => {
      if (msg.type === 'image') {
        console.log('  - Adding image URL:', msg.redactedUrl);
        recentImages.push(msg.redactedUrl);
      }
    });

    // Convert image URLs to base64 data URLs
    console.log('🖼️ Frontend Image Debug:');
    console.log('  - Recent images count:', recentImages.length);
    console.log('  - Recent image URLs:', recentImages);

    const imageBase64s: string[] = [];
    try {
      for (const imageUrl of recentImages) {
        console.log('  - Converting image to base64:', imageUrl);
        const base64 = await blobUrlToBase64(imageUrl);
        console.log('  - Base64 conversion success, length:', base64.length);
        imageBase64s.push(base64);
      }
    } catch (error) {
      console.warn('Failed to convert some images to base64:', error);
    }

    console.log('  - Final base64 images count:', imageBase64s.length);

    // Stream LLM response
    try {
      await streamLLMResponse(
        masked,
        conversationHistory,
        imageBase64s,
        (token: string) => {
          // Update the assistant message with new tokens
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId && msg.type === 'text'
                ? { ...msg, masked: msg.masked + token, streaming: true }
                : msg,
            ),
          );
        },
        () => {
          // Mark streaming as complete
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, streaming: false } : msg)),
          );
        },
        (error: string) => {
          console.error('LLM streaming error:', error);
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId
                ? { ...msg, masked: `Error: ${error}`, streaming: false }
                : msg,
            ),
          );
        },
      );
    } catch (error) {
      console.error('Failed to start LLM stream:', error);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, masked: 'Failed to get response', streaming: false }
            : msg,
        ),
      );
    }
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - ChatGPT style */}
      <div className="w-64 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">PrivyLens</h1>
          <p className="text-sm text-gray-400 mt-1">Privacy-first AI chat</p>
        </div>

        <div className="flex-1 p-4">
          <div className="space-y-4">
            <section className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-medium text-white mb-3">Privacy Settings</h3>
              <PolicyPopover policy={policy} onChange={onPolicyChange} />
            </section>

            <div className="text-xs text-gray-500 p-3">
              <p>✓ Client-side processing</p>
              <p>✓ Auto redaction</p>
              <p>✓ Image privacy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area - ChatGPT style */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PrivyLens Chat</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your messages and images are automatically redacted for privacy
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <ChatStream messages={messages} />
          </div>
        </div>

        {/* Input Area - ChatGPT style */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
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
