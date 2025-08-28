import { describe, it, expect } from 'vitest';
import { ensureMasked } from './policy';

describe('ensureMasked', () => {
  it('flags unmasked content', () => {
    expect(ensureMasked('a@b.com')).toBe(false);
  });
  it('allows masked tokens', () => {
    expect(ensureMasked('[EMAIL] hello [PHONE] [CARD]')).toBe(true);
  });
});

