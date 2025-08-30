'use client';
import React from 'react';
import { supabase } from '@/supabase/client';
import { getSignedUrl, deleteHistoryItem } from '@/lib/history';

type Row = {
  id: string;
  kind: 'image' | 'text';
  created_at: string;
  redacted_path?: string | null;
  original_path?: string | null;
  masked_text?: string | null;
};

export default function History() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [thumbs, setThumbs] = React.useState<Record<string, string>>({}); // row.id -> signed URL
  const [fullscreen, setFullscreen] = React.useState<Row | null>(null);
  const [imgUrl, setImgUrl] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // 1) Load history rows
  React.useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data, error } = await supabase
        .from('redaction_events')
        .select('id, kind, created_at, redacted_path, original_path, masked_text')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('history select error', error);
        return;
      }
      const list = (data ?? []) as Row[];
      setRows(list);

      // 2) Pre-create thumbnail signed URLs for images
      const toSign = list
        .filter((r) => r.kind === 'image' && r.redacted_path)
        .map((r) => ({ id: r.id, path: r.redacted_path as string }));

      // You can batch with createSignedUrls, but per-item is fine too
      const next: Record<string, string> = {};
      await Promise.all(
        toSign.map(async ({ id, path }) => {
          try {
            const url = await getSignedUrl(path, 600); // 10 mins
            next[id] = url;
          } catch (e) {
            console.error('thumb signed url error', e, 'path:', path);
          }
        })
      );
      if (Object.keys(next).length) setThumbs((m) => ({ ...m, ...next }));
    })();
  }, []);

  // 3) When opening an image, fetch a fresh/full-size signed URL
  React.useEffect(() => {
    (async () => {
      if (!(fullscreen?.kind === 'image' && fullscreen.redacted_path)) {
        setImgUrl(null);
        return;
      }
      try {
        const u = await getSignedUrl(fullscreen.redacted_path, 3600);
        setImgUrl(u);
      } catch (e) {
        console.error('Signed URL error:', e, 'path:', fullscreen.redacted_path);
        setImgUrl(null);
      }
    })();
  }, [fullscreen]);

  React.useEffect(() => {
    (async () => {
        if (!(fullscreen?.kind === 'image' && fullscreen.redacted_path)) {
        setImgUrl(null);
        return;
        }
        try {
        // Preferred: signed URL
        const u = await getSignedUrl(fullscreen.redacted_path, 3600);
        setImgUrl(u);
        } catch (e) {
        console.warn('Signed URL failed, falling back to download:', e);
        const clean = fullscreen.redacted_path.startsWith('/')
            ? fullscreen.redacted_path.slice(1)
            : fullscreen.redacted_path;

        const { data, error } = await supabase.storage.from('redactions').download(clean);
        if (error) {
            console.error('Download fallback failed:', error);
            setImgUrl(null);
            return;
        }
        const blobUrl = URL.createObjectURL(data);
        setImgUrl(blobUrl);
        }
    })();
  }, [fullscreen]);

  async function shareCurrent() {
    if (fullscreen?.kind === 'image' && fullscreen.redacted_path) {
      const u = await getSignedUrl(fullscreen.redacted_path, 60 * 60 * 24 * 7);
      await navigator.clipboard.writeText(u);
      alert('Share link copied (valid 7 days)');
    }
    if (fullscreen?.kind === 'text') {
      await navigator.clipboard.writeText(fullscreen.masked_text ?? '');
      alert('Masked text copied');
    }
  }

  async function handleDelete() {
    if (!fullscreen) return;
    if (!confirm('Delete this item permanently?')) return;

    try {
      setDeleting(true);
      await deleteHistoryItem(fullscreen);

      // remove from list + close
      setRows(prev => prev.filter(r => r.id !== fullscreen.id));
      setFullscreen(null);
    } catch (e: any) {
      console.error(e);
      alert(`Delete failed: ${e?.message || e}`);
    } finally {
      setDeleting(false);
    }
  }


  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My History</h1>
          <p className="text-sm text-gray-400">{rows.length} items</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => setFullscreen(r)}
              className="group rounded-xl border border-gray-700 bg-[#1a1a1a] p-3 text-left hover:bg-[#232323] transition"
            >
              <div className="text-xs text-gray-400 mb-2">
                {new Date(r.created_at).toLocaleString()} · {r.kind}
              </div>

              {r.kind === 'image' ? (
                <div className="aspect-video w-full rounded-lg bg-[#0f0f0f] grid place-items-center overflow-hidden">
                  {thumbs[r.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbs[r.id]}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('thumb failed:', (e.target as HTMLImageElement).src);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">Loading…</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-200 line-clamp-4 whitespace-pre-wrap">
                  {r.masked_text}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-5xl rounded-xl border border-gray-700 bg-[#161616]">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="text-sm text-gray-400">
                {new Date(fullscreen.created_at).toLocaleString()} · {fullscreen.kind}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={shareCurrent}
                  className="px-3 py-1.5 rounded bg-[#10a37f] hover:bg-[#0d8a6b] text-white text-sm"
                >
                  Share
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded bg-[#b43a3a] hover:bg-[#992f2f] text-white text-sm disabled:opacity-60"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setFullscreen(null)}
                  className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4">
              {fullscreen.kind === 'image' ? (
                imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="redacted"
                    src={imgUrl}
                    className="w-full h-auto rounded-lg border border-gray-700"
                    onError={(e) => {
                      console.error('full image failed:', (e.target as HTMLImageElement).src);
                      alert('Could not load image (check Network tab for 403/404).');
                    }}
                  />
                ) : (
                  <div className="text-gray-400">Loading image…</div>
                )
              ) : (
                <pre className="whitespace-pre-wrap text-gray-100 text-base bg-[#0f0f0f] p-4 rounded-lg">
                  {fullscreen.masked_text}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

