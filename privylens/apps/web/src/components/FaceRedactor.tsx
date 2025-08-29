import React, { useRef, useState } from 'react';
import { detectFaces } from '../lib/face.js';
import { pixelateRegions } from '../lib/redact.js';

export default function FaceRedactor() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [redactedUrl, setRedactedUrl] = useState<string | null>(null);
  const [facesFound, setFacesFound] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    setRedactedUrl(null);
    setFacesFound(0);
    const localUrl = URL.createObjectURL(file);
    setOriginalUrl(localUrl);
    setBusy(true);
    try {
      const img = await (async () => {
        const el = new Image();
        el.src = localUrl;
        await el.decode();
        return el;
      })();

      const faces = await detectFaces(img);
      setFacesFound(faces.length);

      // Add margin and use heavy pixelation
      const facesWithMargin = faces.map((f) => ({
        x: Math.max(0, f.x - 0.1), // expand left
        y: Math.max(0, f.y - 0.15), // expand up (for forehead)
        w: Math.min(1 - f.x, f.w + 0.2), // expand width
        h: Math.min(1 - f.y, f.h + 0.3), // expand height (for neck)
      }));
      const { dataUrl } = await pixelateRegions(file, facesWithMargin, 0.02); // Much heavier blur
      setRedactedUrl(dataUrl);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      setErr(e?.message || 'Face redaction failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex gap-3 items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <button
          className="px-3 py-1.5 rounded bg-black text-white"
          onClick={() => inputRef.current?.click()}
        >
          Choose Image
        </button>
      </div>

      {busy && <p>Detecting faces and redacting…</p>}
      {err && <p className="text-red-600">{String(err)}</p>}
      {!busy && facesFound > 0 && <p>Faces detected: {facesFound}</p>}
      {!busy && facesFound === 0 && originalUrl && <p>No faces detected.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {originalUrl && (
          <div>
            <p className="text-sm mb-2">Original (local preview)</p>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={originalUrl} className="max-h-96 rounded border" />
          </div>
        )}
        {redactedUrl && (
          <div>
            <p className="text-sm mb-2">Redacted (pixelated faces)</p>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={redactedUrl} className="max-h-96 rounded border" />
          </div>
        )}
      </div>
    </div>
  );
}
