'use client';
import React from 'react';

const TOGGLES = [
  { key: 'emails', label: 'Emails' },
  { key: 'phones', label: 'Phones' },
  { key: 'cards', label: 'Cards' },
  { key: 'faces', label: 'Faces' },
  { key: 'plates', label: 'License Plates' },
  { key: 'ids', label: 'IDs' },
] as const;

export function PolicyPopover({
  policy,
  onChange,
}: {
  policy: Record<string, boolean>;
  onChange: (p: Record<string, boolean>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const toggle = (key: string) => onChange({ ...policy, [key]: !policy[key] });

  return (
    <div className="relative">
      <button
        className="rounded-lg bg-[#404040] border border-gray-600 text-gray-100 px-3 py-2 hover:bg-[#4a4a4a] transition-colors text-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Configure Policy
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-600 bg-[#2f2f2f] shadow-xl z-20"
          >
            <div className="p-3">
              <h4 className="font-medium text-white mb-3">Privacy Settings</h4>
              <div className="space-y-2">
                {TOGGLES.map((t) => (
                  <label
                    key={t.key}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[#404040] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!policy[t.key]}
                      onChange={() => toggle(t.key)}
                      className="w-4 h-4 text-[#10a37f] bg-[#404040] border-gray-600 rounded focus:ring-[#10a37f] focus:ring-2"
                    />
                    <span className="text-gray-100 text-sm">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
