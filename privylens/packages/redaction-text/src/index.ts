export type RedactionLabel = 'EMAIL' | 'PHONE' | 'CARD';

export interface RedactionSpan {
  start: number;
  end: number;
  label: RedactionLabel;
}

export interface RedactPolicy {
  emails: boolean;
  phones: boolean;
  cards: boolean;
}

// Compiled regex patterns (basic versions). These are intentionally conservative.
// TODO: Improve with Luhn check for cards, locale-aware phone parsing, and NER for PERSON/ADDRESS/ID.
export const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
export const PHONE_REGEX = /(?:(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})/g; // simple
export const CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g; // basic; TODO: Luhn validation

function collectMatches(source: string, regex: RegExp, label: RedactionLabel): RedactionSpan[] {
  const spans: RedactionSpan[] = [];
  const r = new RegExp(regex.source, regex.flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(source)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    spans.push({ start, end, label });
    if (m.index === r.lastIndex) r.lastIndex++; // avoid zero-length loops
  }
  return spans;
}

function mergeAndSortSpans(spans: RedactionSpan[]): RedactionSpan[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: RedactionSpan[] = [];
  for (const s of sorted) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(s);
      continue;
    }
    if (s.start <= last.end) {
      // overlap: keep the wider one
      last.end = Math.max(last.end, s.end);
      // Prefer earlier label; no change needed
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

export function basicRedactText(
  text: string,
  policy: Partial<RedactPolicy> = { emails: true, phones: true, cards: true },
): { masked: string; spans: RedactionSpan[] } {
  const effective: RedactPolicy = {
    emails: policy.emails ?? true,
    phones: policy.phones ?? true,
    cards: policy.cards ?? true,
  };

  let spans: RedactionSpan[] = [];
  if (effective.emails) spans = spans.concat(collectMatches(text, EMAIL_REGEX, 'EMAIL'));
  if (effective.phones) spans = spans.concat(collectMatches(text, PHONE_REGEX, 'PHONE'));
  if (effective.cards) spans = spans.concat(collectMatches(text, CARD_REGEX, 'CARD'));

  const merged = mergeAndSortSpans(spans);
  let masked = '';
  let cursor = 0;
  for (const s of merged) {
    masked += text.slice(cursor, s.start);
    masked += `[${s.label}]`;
    cursor = s.end;
  }
  masked += text.slice(cursor);

  // TODO: Add configurable masking strategies and diff spans for UI highlighting.
  // TODO: Integrate NER for PERSON/ADDRESS/ID, linkable via server hooks.
  return { masked, spans: merged };
}

