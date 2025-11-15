import { describe, it, expect } from 'vitest';
import { extractCoreData } from '../../packages/core/src/normalize/normalize-core.js';
import { extractWishes } from '../../packages/core/src/normalize/extract-wishes.js';
import type { RawDocument } from '../../packages/core/src/parsers/raw-document.js';

describe('extractCoreData', () => {
  it('should extract budget from text with € symbol', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'We hebben een budget van € 250.000 voor dit project.',
    };

    const result = extractCoreData(doc);
    expect(result.budget).toBe(250000);
  });

  it('should extract budget from text with k notation', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Budget: 350k',
    };

    const result = extractCoreData(doc);
    expect(result.budget).toBe(350000);
  });

  it('should extract project type verbouwing', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'We willen graag onze woning verbouwen.',
    };

    const result = extractCoreData(doc);
    expect(result.projectType).toBe('verbouwing');
  });

  it('should extract project type nieuwbouw', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Dit is een nieuwbouwproject.',
    };

    const result = extractCoreData(doc);
    expect(result.projectType).toBe('nieuwbouw');
  });

  it('should extract location', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Wij wonen in Amsterdam en willen verbouwen.',
    };

    const result = extractCoreData(doc);
    expect(result.locatie).toBe('Amsterdam');
  });
});

describe('extractWishes', () => {
  it('should extract wishes with "willen graag" pattern', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'We willen graag een open keuken naar de woonkamer. We willen ook een nieuwe badkamer.',
    };

    const wishes = extractWishes(doc);
    expect(wishes.length).toBeGreaterThan(0);
    expect(wishes.some(w => w.includes('open keuken'))).toBe(true);
  });

  it('should extract wishes with "zou graag" pattern', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Ik zou graag vloerverwarming in de nieuwe delen.',
    };

    const wishes = extractWishes(doc);
    expect(wishes.length).toBeGreaterThan(0);
  });

  it('should return empty array when no wishes found', () => {
    const doc: RawDocument = {
      sourceFile: 'test.txt',
      text: 'Dit is een simpele tekst zonder wensen.',
    };

    const wishes = extractWishes(doc);
    expect(wishes).toEqual([]);
  });
});
