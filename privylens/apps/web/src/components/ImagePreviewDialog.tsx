"use client";
import React from 'react';

export function ImagePreviewDialog({ open, onOpenChange, url }: { open: boolean; onOpenChange: (open: boolean) => void; url: string; }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={() => onOpenChange(false)}
    >
      <div className="bg-white rounded-lg p-3 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="redacted preview" className="max-h-[70vh] w-auto mx-auto" />
        <div className="mt-2 text-right">
          <button className="rounded-md border px-3 py-1" onClick={() => onOpenChange(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}

