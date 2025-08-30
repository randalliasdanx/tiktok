'use client';
import React from 'react';
import { redactText } from '@/lib/api';

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
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [attachedImages, setAttachedImages] = React.useState<
    { originalUrl: string; redactedUrl: string }[]
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const submit = async () => {
    const value = text.trim();
    if (!value && attachedImages.length === 0) return;
    setLoading(true);
    try {
      // Send attached images first
      for (const img of attachedImages) {
        if (onImageAttached) {
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
    setAttachedImages((prev) => [...prev, { originalUrl, redactedUrl }]);
  };

  const removeAttachment = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Expose the attachment handler globally so FaceRedactor can use it
  React.useEffect(() => {
    (window as any).attachImageToChat = handleImageAttachment;
    return () => {
      delete (window as any).attachImageToChat;
    };
  }, []);

  return (
    <div className="bg-[#404040] rounded-lg border border-gray-600 p-3">
      {/* Image attachments preview */}
      {attachedImages.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedImages.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img.redactedUrl}
                alt={`Attachment ${index + 1}`}
                className="h-16 w-16 object-cover rounded border border-gray-500"
              />
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            className="w-full resize-none bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none text-base leading-6"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              attachedImages.length > 0
                ? 'Add a message with your images...'
                : 'Type sensitive information here (emails, phones, etc.) - it will be redacted automatically...'
            }
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
        </div>
        <button
          className="shrink-0 rounded-lg bg-[#10a37f] hover:bg-[#0d8a6b] text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={submit}
          disabled={loading || (!text.trim() && attachedImages.length === 0)}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
      {(text.trim() || attachedImages.length > 0) && (
        <div className="mt-2 text-xs text-gray-500">
          Press ⌘⏎ to send
          {attachedImages.length > 0 &&
            ` • ${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''} attached`}
          {text.trim() && ' • Text will be automatically redacted'}
        </div>
      )}
    </div>
  );
}
