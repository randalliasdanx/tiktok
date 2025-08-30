import { supabase } from '@/supabase/client';

function tsSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function fetchBlob(url: string) {
  const r = await fetch(url);
  return await r.blob();
}

export async function saveImageRedaction({
  userId,
  originalUrl,      // local blob URL (optional)
  redactedUrl,      // local blob URL (required)
  facesCount = 0,
  saveOriginal = false,
}: {
  userId: string;
  originalUrl?: string;
  redactedUrl: string;
  facesCount?: number;
  saveOriginal?: boolean;
}) {
  const base = `user/${userId}/images/${tsSlug()}`;
  const uploads: { original_path?: string; redacted_path: string } = { redacted_path: '' };

  // Upload redacted
  const redBlob = await fetchBlob(redactedUrl);
  const redPath = `${base}/redacted.png`;
  const { data: redUp, error: redErr } = await supabase
    .storage.from('redactions')
    .upload(redPath, redBlob, { contentType: 'image/png' });
  if (redErr) throw redErr;
  uploads.redacted_path = redUp!.path;

  // Upload original (optional)
  if (saveOriginal && originalUrl) {
    const origBlob = await fetchBlob(originalUrl);
    const origPath = `${base}/original.png`;
    const { data: origUp, error: origErr } = await supabase
      .storage.from('redactions')
      .upload(origPath, origBlob, { contentType: 'image/png' });
    if (origErr) throw origErr;
    uploads.original_path = origUp!.path;
  }

  // Insert event row
  const { error } = await supabase.from('redaction_events').insert({
    user_id: userId,
    kind: 'image',
    faces_count: facesCount,
    ...uploads,
    meta: {},
  });
  if (error) throw error;
}

const clean = (p?: string | null) => (p ? (p.startsWith('/') ? p.slice(1) : p) : null);

/** Delete one history row + its storage objects (if any). */
export async function deleteHistoryItem(row: {
  id: string;
  kind: 'image' | 'text';
  redacted_path?: string | null;
  original_path?: string | null;
}) {
  // 1) delete storage objects first (if image)
  if (row.kind === 'image') {
    const keys: string[] = [];
    const r = clean(row.redacted_path);
    const o = clean(row.original_path);
    if (r) keys.push(r);
    if (o) keys.push(o);
    if (keys.length) {
      const { error: rmErr } = await supabase.storage.from('redactions').remove(keys);
      if (rmErr) throw rmErr;
    }
  }

  // 2) delete the DB row
  const { error: delErr } = await supabase.from('redaction_events').delete().eq('id', row.id);
  if (delErr) throw delErr;
}

export async function saveTextRedaction({
  userId,
  masked,
  original,
  saveOriginal = false,
}: {
  userId: string;
  masked: string;
  original?: string;
  saveOriginal?: boolean;
}) {
  const { error } = await supabase.from('redaction_events').insert({
    user_id: userId,
    kind: 'text',
    masked_text: masked,
    original_text: saveOriginal ? original ?? null : null,
  });
  if (error) throw error;
}

export async function getSignedUrl(path: string, secs = 3600) {
  // Ensure no leading slash
  const clean = path.startsWith('/') ? path.slice(1) : path;

  const { data, error } = await supabase
    .storage
    .from('redactions')
    .createSignedUrl(clean, secs, { download: false }); // renderable in <img>

  if (error) throw error;
  const url = data.signedUrl;

  // Sanity check: fail early if the URL won’t load
  const head = await fetch(url, { method: 'HEAD' });
  if (!head.ok) throw new Error(`Signed URL HEAD failed: ${head.status} ${head.statusText}`);

  return url;
}

