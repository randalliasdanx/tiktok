import Jimp from 'jimp';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactOptions {
  boxes?: BoundingBox[];
  pixelSize?: number;
}

export async function redactImageBuffer(input: Buffer, options: RedactOptions = {}): Promise<Buffer> {
  const image = await Jimp.read(input);
  const pixelSize = Math.max(6, Math.min(options.pixelSize ?? 16, 64));
  const boxes: BoundingBox[] = options.boxes ?? [
    // Dummy rectangle for demo
    {
      x: Math.floor(image.bitmap.width * 0.1),
      y: Math.floor(image.bitmap.height * 0.1),
      width: Math.floor(image.bitmap.width * 0.3),
      height: Math.floor(image.bitmap.height * 0.2),
    },
  ];

  for (const box of boxes) {
    const x = Math.max(0, Math.min(box.x, image.bitmap.width - 1));
    const y = Math.max(0, Math.min(box.y, image.bitmap.height - 1));
    const w = Math.max(1, Math.min(box.width, image.bitmap.width - x));
    const h = Math.max(1, Math.min(box.height, image.bitmap.height - y));
    const region = image.clone().crop(x, y, w, h);
    region.pixelate(pixelSize);
    image.composite(region, x, y);
  }

  // TODO: Plug OCR/face/license-plate detectors to generate bounding boxes.
  return await image.getBufferAsync(Jimp.MIME_PNG);
}

