import React, { useRef, useState } from 'react';
import { detectFaces } from '../lib/face.js';
import { pixelateRegions } from '../lib/redact.js';
import { ImagePreviewDialog } from './ImagePreviewDialog.js';
import { ImageProcessingPipeline } from './ImageProcessingPipeline';
import { saveImageRedaction } from '@/lib/history';
import { supabase } from '../supabase/client';

interface FaceRedactorProps {
  onImageReady?: (
    originalUrl: string,
    redactedUrl: string,
    choice?: 'original' | 'redacted',
  ) => void;
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
    <div className="space-y-6">
      {/* Upload Button */}
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
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 text-sm font-medium transform hover:scale-105 shadow-lg"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Processing...' : 'Choose Image to Redact'}
        </button>
      </div>

      {/* Error Display */}
      {err && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-600 rounded-xl p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {String(err)}
          </div>
        </div>
      )}

      {/* Processing Pipeline */}
      {originalUrl && (
        <ImageProcessingPipeline
          originalUrl={originalUrl}
          redactedUrl={redactedUrl}
          isProcessing={busy}
          facesFound={facesFound}
          onComplete={() => {
            // Optional callback when processing completes
          }}
        />
      )}

      {/* Results */}
      {!busy && originalUrl && (
        <div className="space-y-4">
          {facesFound > 0 && (
            <div className="text-green-400 text-sm bg-green-900/20 border border-green-600 rounded-xl p-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    {facesFound} face{facesFound > 1 ? 's' : ''} detected and protected
                  </span>
                </div>
                <span className="text-xs text-green-300 bg-green-800/30 px-2 py-1 rounded">
                  TinyFaceDetector
                </span>
              </div>
            </div>
          )}

          {facesFound === 0 && (
            <div className="text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-600 rounded-xl p-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  No faces detected in this image
                  {detectionInfo && (
                    <div className="text-xs text-yellow-300 mt-1">Tried TinyFaceDetector model</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {redactedUrl && (
              <button
                onClick={() => setPreview({ originalUrl, redactedUrl })}
                className="sm:flex-1 px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Full Size View
              </button>
            )}

            {/* Add original to chat */}
            {originalUrl && (
              <button
                className="sm:flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                onClick={() => {
                  if (onImageReady) {
                    onImageReady(originalUrl!, redactedUrl || originalUrl!, 'original');
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
                Add Original to Chat
              </button>
            )}

            {/* Add redacted to chat */}
            {redactedUrl && (
              <button
                className="sm:flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                onClick={() => {
                  if (onImageReady) {
                    onImageReady(originalUrl!, redactedUrl, 'redacted');
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
                Add Redacted to Chat
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
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
