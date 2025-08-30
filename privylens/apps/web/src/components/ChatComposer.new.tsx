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
  onImageAttached?: (originalUrl: string, redactedUrl: string) => void;
  policy: Record<string, boolean>;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [attachedImages, setAttachedImages] = useState<
    { originalUrl: string; redactedUrl: string; converting?: boolean }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const value = text.trim();
    if (!value && attachedImages.length === 0) return;
    setLoading(true);
    try {
      // Send attached images first
      for (const img of attachedImages) {
        if (onImageAttached && !img.converting) {
          onImageAttached(img.originalUrl, img.redactedUrl);
        }
      }

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

  const handleImageAttachment = (originalUrl: string, redactedUrl: string) => {
    // Show conversion animation
    const newImage = { originalUrl, redactedUrl, converting: true };
    setAttachedImages((prev) => [...prev, newImage]);

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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 shadow-lg">
        {/* Image attachments preview */}
        {attachedImages.length > 0 && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="relative">
                    <img
                      src={img.converting ? img.originalUrl : img.redactedUrl}
                      alt={`Attachment ${index + 1}`}
                      className={`h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600 transition-all duration-500 ${
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
                    <div className="absolute -bottom-6 left-0 text-xs text-gray-500 dark:text-gray-400">
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
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            aria-label="Attach image"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
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
              className="w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base leading-6 min-h-[24px] max-h-[200px]"
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
            className="flex-shrink-0 rounded-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="px-3 pb-2 text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
            {attachedImages.length > 0 &&
              ` • ${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''} attached`}
            {text.trim() && ' • Text will be automatically redacted'}
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Image</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-600 dark:text-gray-300"
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
            <div className="p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload an image and faces will be automatically detected and blurred for privacy.
              </div>
              <FaceRedactor onImageReady={handleImageAttachment} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
