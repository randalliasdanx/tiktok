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

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function streamLLMResponse(
  masked: string, 
  messages: ChatMessage[] = [],
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/llm/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ masked, messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onToken(parsed.content);
            } else if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
    
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}


