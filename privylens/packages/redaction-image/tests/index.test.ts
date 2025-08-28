import { describe, it, expect } from 'vitest';
import { redactImageBuffer } from '../src/index';

describe('redactImageBuffer', () => {
  it('processes a small dummy image buffer', async () => {
    // Create a tiny PNG using Jimp at runtime to avoid assets
    const Jimp = (await import('jimp')).default;
    const img = new Jimp({ width: 32, height: 32, color: 0xffffffff });
    const buf = await img.getBufferAsync(Jimp.MIME_PNG);
    const out = await redactImageBuffer(buf, { pixelSize: 8 });
    expect(out.byteLength).toBeGreaterThan(0);
  });
});

