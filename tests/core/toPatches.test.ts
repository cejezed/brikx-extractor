import { describe, it, expect } from 'vitest';
import { customerExampleToPatches } from '../../packages/core/src/toPatches/toPatches.js';
import type { CustomerExample } from '../../packages/core/src/types/customer-example.js';

describe('customerExampleToPatches', () => {
  it('should create set patch for projectType', () => {
    const example: CustomerExample = {
      coreData: { projectType: 'verbouwing' },
      wishes: [],
      emotionalSignals: [],
    };

    const patches = customerExampleToPatches(example);

    expect(patches.some(p =>
      p.chapter === 'basis' &&
      p.delta.path === 'projectType' &&
      p.delta.operation === 'set' &&
      p.delta.value === 'verbouwing'
    )).toBe(true);
  });

  it('should create set patch for budget', () => {
    const example: CustomerExample = {
      coreData: { budget: 250000 },
      wishes: [],
      emotionalSignals: [],
    };

    const patches = customerExampleToPatches(example);

    expect(patches.some(p =>
      p.chapter === 'budget' &&
      p.delta.path === 'budgetTotaal' &&
      p.delta.operation === 'set' &&
      p.delta.value === 250000
    )).toBe(true);
  });

  it('should create set patch for locatie', () => {
    const example: CustomerExample = {
      coreData: { locatie: 'Amsterdam' },
      wishes: [],
      emotionalSignals: [],
    };

    const patches = customerExampleToPatches(example);

    expect(patches.some(p =>
      p.chapter === 'basis' &&
      p.delta.path === 'locatie' &&
      p.delta.operation === 'set' &&
      p.delta.value === 'Amsterdam'
    )).toBe(true);
  });

  it('should create append patches for wishes', () => {
    const example: CustomerExample = {
      coreData: {},
      wishes: ['We willen een open keuken', 'Badkamer moet modern zijn'],
      emotionalSignals: [],
    };

    const patches = customerExampleToPatches(example);

    const wishPatches = patches.filter(p =>
      p.chapter === 'wensen' &&
      p.delta.path === 'wishes' &&
      p.delta.operation === 'append'
    );

    expect(wishPatches.length).toBe(2);

    // Check that each wish has id, text, category, priority
    wishPatches.forEach(patch => {
      expect(patch.delta.value).toHaveProperty('id');
      expect(patch.delta.value).toHaveProperty('text');
      expect(patch.delta.value).toHaveProperty('category');
      expect(patch.delta.value).toHaveProperty('priority');
    });
  });

  it('should only use set and append operations', () => {
    const example: CustomerExample = {
      coreData: {
        projectType: 'nieuwbouw',
        budget: 300000,
        locatie: 'Utrecht',
      },
      wishes: ['Moderne woning', 'Energiezuinig'],
      emotionalSignals: [],
    };

    const patches = customerExampleToPatches(example);

    // All operations should be either 'set' or 'append'
    patches.forEach(patch => {
      expect(['set', 'append']).toContain(patch.delta.operation);
    });
  });
});
