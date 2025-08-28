"use client";
import React from 'react';
import { redactImage } from '@/lib/api';

export function ImageDropzone({ onUploaded, policy }: { onUploaded: (originalThumbUrl: string, redactedUrl: string) => void; policy: Record<string, boolean>; }) {
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
      className={`border-2 border-dashed rounded-lg p-6 text-center ${dragOver ? 'bg-gray-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
    >
      <p className="mb-2">Drag & drop an image, or click to upload</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm"
      />
    </div>
  );
}

