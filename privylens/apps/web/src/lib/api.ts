export type RedactTextResponse = {
  masked: string;
  spans: { start: number; end: number; label: string }[];
};

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

// Convert blob URL to base64 data URL for OpenAI API with compression
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  
  // Create an image element to compress the image
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Resize image to max 1024px while maintaining aspect ratio
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression (0.7 quality)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

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
  images: string[] = [],
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('🚀 API Call Debug:');
    console.log('  - Masked:', masked);
    console.log('  - Messages:', messages.length);
    console.log('  - Images to send:', images.length);
    console.log('  - First image preview:', images.length > 0 ? images[0].substring(0, 100) + '...' : 'None');
    
    const requestBody = { masked, messages, images };
    console.log('  - Request body keys:', Object.keys(requestBody));
    console.log('  - Images in request body:', requestBody.images.length);
    
    const response = await fetch(`${API_URL}/api/llm/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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


