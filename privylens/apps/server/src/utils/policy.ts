import { z } from 'zod';

export const MaskedInputSchema = z.object({
  masked: z.string().min(0),
});

export function ensureMasked(masked: string): boolean {
  // Ensures the text contains no plausible raw email/phone/card sequences anymore.
  // Note: This is a heuristic safety helper; server still redacts upstream.
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phone = /(?:(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})/;
  const card = /\b(?:\d[ -]*?){13,19}\b/;
  return !(email.test(masked) || card.test(masked) || phone.test(masked));
}

// TODO: Add richer policy checks and enforcement against configured policy toggles.

