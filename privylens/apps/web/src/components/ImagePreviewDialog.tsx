'use client';
import React from 'react';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalUrl: string;
  redactedUrl: string;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  originalUrl,
  redactedUrl,
}: ImagePreviewDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-[#2f2f2f] rounded-lg border border-gray-600 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Image Comparison</h3>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Image */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h4 className="font-medium text-white">Original (Sensitive)</h4>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalUrl}
                className="max-h-[50vh] w-auto mx-auto rounded"
                alt="Original image with faces visible"
              />
            </div>
          </div>

          {/* Redacted Image */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-medium text-white">Redacted (Safe)</h4>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={redactedUrl}
                className="max-h-[50vh] w-auto mx-auto rounded"
                alt="Redacted image with faces blurred"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            className="bg-[#10a37f] hover:bg-[#0d8a6b] text-white px-6 py-2 rounded-lg transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
