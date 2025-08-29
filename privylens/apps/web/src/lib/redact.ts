export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function pixelateRegions(
  file: File,
  boxes: { x: number; y: number; w: number; h: number }[],
  intensity = 0.04,
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await fileToImage(file);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, W, H);

  for (const b of boxes) {
    const x = Math.max(0, Math.floor(b.x * W));
    const y = Math.max(0, Math.floor(b.y * H));
    const w = Math.min(W - x, Math.ceil(b.w * W));
    const h = Math.min(H - y, Math.ceil(b.h * H));
    if (w <= 0 || h <= 0) continue;

    const sw = Math.max(1, Math.floor(w * intensity));
    const sh = Math.max(1, Math.floor(h * intensity));

    const tmp = document.createElement('canvas');
    tmp.width = sw;
    tmp.height = sh;
    const tctx = tmp.getContext('2d')!;
    tctx.imageSmoothingEnabled = false;

    tctx.drawImage(canvas, x, y, w, h, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, sw, sh, x, y, w, h);
    
    // Add extra Gaussian blur on top
    ctx.filter = 'blur(4px)';
    ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
    ctx.filter = 'none';
  }

  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png', 1));
  const dataUrl = canvas.toDataURL('image/png');
  return { blob, dataUrl };
}


