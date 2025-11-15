import { describe, it, expect } from 'vitest';
import { extractFromFile } from '../../packages/core/src/index.js';
import { join } from 'path';

describe('extractFromFile integration', () => {
  it('should extract complete data from intake.txt', async () => {
    const filePath = join(process.cwd(), 'tests/fixtures/intake.txt');
    const result = await extractFromFile(filePath);

    // Check structure
    expect(result).toHaveProperty('customerExample');
    expect(result).toHaveProperty('patches');
    expect(result).toHaveProperty('meta');

    // Check customer example
    expect(result.customerExample.coreData.projectType).toBe('verbouwing');
    expect(result.customerExample.coreData.budget).toBe(250000);
    expect(result.customerExample.coreData.locatie).toBe('Amsterdam');

    // Should have wishes
    expect(result.customerExample.wishes.length).toBeGreaterThan(0);

    // Should have emotional signals
    expect(result.customerExample.emotionalSignals.length).toBeGreaterThan(0);

    // Check patches
    expect(result.patches.length).toBeGreaterThan(0);

    // All patches should have valid chapter and delta
    result.patches.forEach(patch => {
      expect(patch).toHaveProperty('chapter');
      expect(patch).toHaveProperty('delta');
      expect(patch.delta).toHaveProperty('path');
      expect(patch.delta).toHaveProperty('operation');
      expect(['set', 'append', 'remove']).toContain(patch.delta.operation);
    });

    // Check meta
    expect(result.meta.sourceFile).toBe(filePath);
    expect(result.meta.confidence).toBeGreaterThan(0);
    expect(result.meta.confidence).toBeLessThanOrEqual(1);
  });

  it('should extract data from simple.txt', async () => {
    const filePath = join(process.cwd(), 'tests/fixtures/simple.txt');
    const result = await extractFromFile(filePath);

    expect(result.customerExample.coreData.projectType).toBe('nieuwbouw');
    expect(result.customerExample.coreData.budget).toBe(350000);
    expect(result.customerExample.coreData.locatie).toBe('Rotterdam');

    // Should detect enthusiasm
    const hasEnthusiasm = result.customerExample.emotionalSignals.some(
      s => s.type === 'enthusiasm'
    );
    expect(hasEnthusiasm).toBe(true);
  });

  it('should handle missing data gracefully', async () => {
    const filePath = join(process.cwd(), 'tests/fixtures/simple.txt');
    const result = await extractFromFile(filePath);

    // Even with minimal data, should return valid structure
    expect(result.customerExample).toBeDefined();
    expect(result.patches).toBeDefined();
    expect(Array.isArray(result.patches)).toBe(true);

    // Should have warnings for missing data
    expect(result.meta.warnings).toBeDefined();
  });
});
