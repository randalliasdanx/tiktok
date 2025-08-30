'use client';
import React from 'react';
import { redactImage } from '@/lib/api';

export function ImageDropzone({
  onUploaded,
  policy,
}: {
  onUploaded: (originalThumbUrl: string, redactedUrl: string) => void;
  policy: Record<string, boolean>;
}) {
  const [dragOver, setDragOver] = React.useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('File too large (limit 8MB)');
      return;
    }
    const objUrl = URL.createObjectURL(file);
    const { redactedUrl } = await redactImage(file);
    onUploaded(objUrl, redactedUrl);
  };

  return (
    <div
      className={`border-2 border-dashed border-gray-600 rounded-lg p-8 text-center transition-colors ${
        dragOver ? 'bg-[#404040] border-[#10a37f]' : 'hover:bg-[#404040]/50'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <p className="text-gray-300 mb-2">Drag & drop an image here</p>
          <p className="text-gray-500 text-sm mb-4">or</p>
          <label className="cursor-pointer inline-block">
            <span className="bg-[#10a37f] hover:bg-[#0d8a6b] text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Browse Files
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">Supports JPG, PNG, GIF up to 8MB</p>
      </div>
    </div>
  );
}
