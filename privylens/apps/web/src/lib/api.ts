export type RedactTextResponse = {
  masked: string;
  spans: { start: number; end: number; label: string }[];
};

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export async function redactText(text: string, policy?: Record<string, boolean>): Promise<RedactTextResponse> {
  const res = await fetch(`${API_URL}/api/redact/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, policy }),
  });
  if (!res.ok) throw new Error('Failed to redact text');
  return (await res.json()) as RedactTextResponse;
}

export async function redactImage(file: File): Promise<{ redactedUrl: string; width?: number; height?: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/api/redact/image`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Failed to redact image');
  const blob = await res.blob();
  const redactedUrl = URL.createObjectURL(blob);
  return { redactedUrl };
}


