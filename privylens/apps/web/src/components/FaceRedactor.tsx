import React, { useRef, useState } from 'react';
import { detectFaces } from '../lib/face.js';
import { pixelateRegions } from '../lib/redact.js';
import { ImagePreviewDialog } from './ImagePreviewDialog.js';
import { saveImageRedaction } from '@/lib/history';
import { supabase } from '../supabase/client';

interface FaceRedactorProps {
  onImageReady?: (originalUrl: string, redactedUrl: string) => void;
}

export default function FaceRedactor({ onImageReady }: FaceRedactorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [redactedUrl, setRedactedUrl] = useState<string | null>(null);
  const [facesFound, setFacesFound] = useState<number>(0);
  const [detectionInfo, setDetectionInfo] = useState<{
    models: string[];
    totalAttempts: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ originalUrl: string; redactedUrl: string } | null>(null);

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

      // Track detection info
      setDetectionInfo({
        models: faces.length > 0 ? ['tiny'] : [],
        totalAttempts: 1,
      });

      // Add minimal margin for precise face-only redaction
      const facesWithMargin = faces.map((f) => ({
        x: Math.max(0, f.x - 0.02), // minimal left expansion
        y: Math.max(0, f.y - 0.05), // minimal top expansion (slight forehead)
        w: Math.min(1 - f.x, f.w + 0.04), // minimal width expansion
        h: Math.min(1 - f.y, f.h + 0.08), // minimal height expansion
      }));
      const { dataUrl } = await pixelateRegions(file, facesWithMargin, 0.02); // Much heavier blur
      setRedactedUrl(dataUrl);
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await saveImageRedaction({
          userId: user.id,
          originalUrl: localUrl,
          redactedUrl: dataUrl,
          facesCount: faces.length,
          // choose whether to store originals
          saveOriginal: false, // or toggle from a user setting
        });
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      setErr(e?.message || 'Face redaction failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
          className="hidden"
        />
        <button
          className="w-full px-4 py-2 rounded-lg bg-[#10a37f] hover:bg-[#0d8a6b] text-white transition-colors text-sm font-medium"
          onClick={() => inputRef.current?.click()}
        >
          Choose Image to Redact
        </button>
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <div className="w-4 h-4 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
          Detecting faces and redacting…
        </div>
      )}

      {err && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
          {String(err)}
        </div>
      )}

      {!busy && facesFound > 0 && (
        <div className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span>
              ✓ {facesFound} face{facesFound > 1 ? 's' : ''} detected and redacted
            </span>
            <span className="text-xs text-green-300">TinyFaceDetector</span>
          </div>
        </div>
      )}

      {!busy && facesFound === 0 && originalUrl && (
        <div className="text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
          <div>
            ⚠ No faces detected in this image
            {detectionInfo && (
              <div className="text-xs text-yellow-300 mt-1">Tried TinyFaceDetector model</div>
            )}
          </div>
        </div>
      )}

      {originalUrl && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Preview (click to compare original vs redacted)</p>
          <button
            className="block w-full focus:outline-none group"
            onClick={() => redactedUrl && setPreview({ originalUrl, redactedUrl })}
            disabled={!redactedUrl}
          >
            <div className="relative bg-[#1a1a1a] rounded-lg p-2 border border-gray-600">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                src={redactedUrl || originalUrl}
                className="max-h-32 w-auto mx-auto rounded transition-transform group-hover:scale-105"
              />
              {redactedUrl && (
                <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Click to compare</span>
                </div>
              )}
            </div>
          </button>

          {/* Add to Chat button */}
          {redactedUrl && (
            <button
              className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              onClick={() => {
                if (onImageReady) {
                  onImageReady(originalUrl!, redactedUrl);
                }
                // Also add to chat composer if available
                const globalAttach = (window as any).attachImageToChat;
                if (globalAttach) {
                  globalAttach(originalUrl!, redactedUrl);
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Add to Chat
            </button>
          )}
        </div>
      )}

      {preview && (
        <ImagePreviewDialog
          open={!!preview}
          onOpenChange={() => setPreview(null)}
          originalUrl={preview.originalUrl}
          redactedUrl={preview.redactedUrl}
        />
      )}
    </div>
  );
}
