'use client';
import React, { useState, useRef } from 'react';
import { redactText } from '@/lib/api';
import FaceRedactor from './FaceRedactor';

export function ChatComposer({
  onRedacted,
  onImageAttached,
  policy,
}: {
  onRedacted: (
    masked: string,
    spans: Array<{ start: number; end: number; label: string }>,
    original: string,
  ) => void;
  onImageAttached?: (
    originalUrl: string,
    redactedUrl: string,
    choice: 'original' | 'redacted',
  ) => void;
  policy: Record<string, boolean>;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [attachedImages, setAttachedImages] = useState<
    { originalUrl: string; redactedUrl: string; converting?: boolean; useOriginal?: boolean }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const value = text.trim();
    if (!value && attachedImages.length === 0) return;
    setLoading(true);
    try {
      // Images are already sent when attached, no need to send again

      // Then send text if any
      if (value) {
        console.log('Submitting text:', value);
        console.log('Policy:', policy);
        const { masked, spans } = await redactText(value, policy);
        console.log('Redacted result:', { masked, spans });
        onRedacted(masked, spans, value);
      }

      setText('');
      setAttachedImages([]);
    } catch (error) {
      console.error('Error in submit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageAttachment = (
    originalUrl: string,
    redactedUrl: string,
    choice: 'original' | 'redacted' = 'redacted',
  ) => {
    // Show conversion animation
    const newImage = {
      originalUrl,
      redactedUrl,
      converting: true,
      useOriginal: choice === 'original',
    };
    setAttachedImages((prev) => [...prev, newImage]);

    // Immediately add to chat for AI to analyze
    if (onImageAttached) {
      onImageAttached(originalUrl, redactedUrl, choice);
    }

    // After 2 seconds, mark as converted
    setTimeout(() => {
      setAttachedImages((prev) =>
        prev.map((img) => (img.originalUrl === originalUrl ? { ...img, converting: false } : img)),
      );
    }, 2000);

    setShowImageUpload(false);
  };

  const removeAttachment = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  return (
    <>
      <div className="bg-[#2f2f2f] rounded-2xl border border-gray-600 shadow-2xl">
        {/* Image attachments preview */}
        {attachedImages.length > 0 && (
          <div className="p-3 border-b border-gray-600">
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="relative">
                    <img
                      src={
                        img.converting
                          ? img.originalUrl
                          : img.useOriginal
                            ? img.originalUrl
                            : img.redactedUrl
                      }
                      alt={`Attachment ${index + 1}`}
                      className={`h-16 w-16 object-cover rounded-lg border border-gray-500 transition-all duration-500 ${
                        img.converting ? 'filter blur-none' : 'filter'
                      }`}
                    />
                    {img.converting && (
                      <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  {img.converting && (
                    <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
                      Converting...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-2 p-3">
          {/* Plus button */}
          <button
            onClick={() => setShowImageUpload(true)}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            aria-label="Attach image"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="w-full resize-none bg-transparent text-white placeholder-gray-400 focus:outline-none text-base leading-6 min-h-[24px] max-h-[200px]"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                attachedImages.length > 0
                  ? 'Add a message with your images...'
                  : 'Message PrivyLens...'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>

          {/* Send button */}
          <button
            className="flex-shrink-0 rounded-full bg-white hover:bg-gray-100 text-black p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
            onClick={submit}
            disabled={
              loading ||
              (!text.trim() && attachedImages.filter((img) => !img.converting).length === 0)
            }
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        {(text.trim() || attachedImages.length > 0) && (
          <div className="px-3 pb-2 text-xs text-gray-400">
            Press Enter to send, Shift+Enter for new line
            {attachedImages.length > 0 &&
              ` • ${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''} attached`}
            {text.trim() && ' • Text will be automatically redacted'}
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div
          className="absolute bg-black/70 backdrop-blur-sm flex ustify-center z-50 px-4 pt-2 pb-4 animate-in fade-in duration-200"
          style={{
            bottom: 100,
          }}
        >
          <div className="bg-[#1a1a1a] border border-gray-600 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 animate-pulse"></span>
                Upload Image
              </h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div className="text-sm text-gray-400 mb-4">
                Upload an image and faces will be automatically detected and blurred for privacy.
              </div>
              <FaceRedactor onImageReady={(o, r, choice) => handleImageAttachment(o, r, choice)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
