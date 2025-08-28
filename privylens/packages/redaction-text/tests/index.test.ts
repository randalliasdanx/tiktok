import { describe, it, expect } from 'vitest';
import { basicRedactText } from '../src/index';

describe('basicRedactText', () => {
  it('masks emails, phones, and cards', () => {
    const input = 'Email a@b.com phone +1-415-555-1212 card 4111 1111 1111 1111';
    const { masked, spans } = basicRedactText(input);
    expect(masked).toContain('[EMAIL]');
    expect(masked).toContain('[PHONE]');
    expect(masked).toContain('[CARD]');
    expect(spans.length).toBeGreaterThanOrEqual(3);
  });
});

