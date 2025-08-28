"use client";
import React from 'react';
import { redactText } from '@/lib/api';

export function ChatComposer({
  onRedacted,
  policy,
}: {
  onRedacted: (masked: string, spans: Array<{ start: number; end: number; label: string }>, original: string) => void;
  policy: Record<string, boolean>;
}) {
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setLoading(true);
    try {
      const { masked, spans } = await redactText(value, policy);
      onRedacted(masked, spans, value);
      setText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        className="flex-1 resize-none rounded-md border p-2 focus:outline-none focus:ring"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something with emails/phones/cards to mask..."
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
        }}
      />
      <button
        className="shrink-0 rounded-md bg-black text-white px-3 py-2 disabled:opacity-50"
        onClick={submit}
        disabled={loading}
      >
        {loading ? 'Redacting…' : 'Redact & Send'}
      </button>
    </div>
  );
}

