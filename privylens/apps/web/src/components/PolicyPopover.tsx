'use client';
import React from 'react';
import { createPortal } from 'react-dom';

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
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const toggle = (key: string) => onChange({ ...policy, [key]: !policy[key] });

  React.useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, // 8px spacing
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="rounded-lg bg-[#404040] border border-gray-600 text-gray-100 px-3 py-2 hover:bg-[#4a4a4a] transition-colors text-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Configure Policy
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed z-50 w-64 rounded-lg border border-gray-600 bg-[#2f2f2f] shadow-xl"
              style={{
                top: coords.top,
                left: coords.left,
              }}
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
          </>,
          document.body
        )}
    </div>
  );
}