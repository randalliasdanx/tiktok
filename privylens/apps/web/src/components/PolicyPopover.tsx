"use client";
import React from 'react';

const TOGGLES = [
  { key: 'emails', label: 'Emails' },
  { key: 'phones', label: 'Phones' },
  { key: 'cards', label: 'Cards' },
  { key: 'faces', label: 'Faces' },
  { key: 'plates', label: 'License Plates' },
  { key: 'ids', label: 'IDs' },
] as const;

export function PolicyPopover({ policy, onChange }: { policy: Record<string, boolean>; onChange: (p: Record<string, boolean>) => void; }) {
  const [open, setOpen] = React.useState(false);
  const toggle = (key: string) => onChange({ ...policy, [key]: !policy[key] });
  return (
    <div className="relative">
      <button className="rounded-md border px-3 py-1" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        Policy
      </button>
      {open && (
        <div role="dialog" aria-modal="true" className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow">
          <div className="p-2 space-y-1">
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex items-center gap-2">
                <input type="checkbox" checked={!!policy[t.key]} onChange={() => toggle(t.key)} />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

