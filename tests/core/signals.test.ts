import { describe, it, expect } from 'vitest';
import { extractSignals } from '../../packages/core/src/signals/extract-signals.js';
import type { RawDocument } from '../../packages/core/src/parsers/raw-document.js';

describe('extractSignals', () => {
  it('should detect uncertainty signals', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Ik ben een beetje onzeker over de planning.',
    };

    const signals = extractSignals(doc);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some(s => s.type === 'uncertainty')).toBe(true);
  });

  it('should detect concern signals', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Ik maak me zorgen over de kosten.',
    };

    const signals = extractSignals(doc);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some(s => s.type === 'concern')).toBe(true);
  });

  it('should detect enthusiasm signals', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'We zijn super enthousiast om te beginnen!',
    };

    const signals = extractSignals(doc);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some(s => s.type === 'enthusiasm')).toBe(true);
  });

  it('should detect urgency signals', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'We willen zo snel mogelijk beginnen.',
    };

    const signals = extractSignals(doc);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some(s => s.type === 'urgency')).toBe(true);
  });

  it('should include quote and interpretedIntent', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'We zijn mega enthousiast!',
    };

    const signals = extractSignals(doc);
    expect(signals.length).toBeGreaterThan(0);

    const signal = signals[0];
    expect(signal.quote).toBeTruthy();
    expect(signal.interpretedIntent).toBeTruthy();
    expect(signal.intensity).toBeGreaterThan(0);
  });
});
