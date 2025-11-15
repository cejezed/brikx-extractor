import { randomUUID } from 'crypto';
import type { CustomerExample } from '../types/customer-example.js';
import type { PatchEvent } from '../types/brikx.js';

type WishCategory = 'comfort' | 'style' | 'function' | 'other';
type WishPriority = 'must' | 'nice' | 'optional';

type Wish = {
  id: string;
  text: string;
  category?: WishCategory;
  priority?: WishPriority;
};

/**
 * Converts a CustomerExample to Brikx-compatible PatchEvent array
 * Uses only 'set' and 'append' operations (no 'remove')
 */
export function customerExampleToPatches(example: CustomerExample): PatchEvent[] {
  const patches: PatchEvent[] = [];

  // 1. Core data patches
  if (example.coreData.projectType) {
    patches.push({
      chapter: 'basis',
      delta: {
        path: 'projectType',
        operation: 'set',
        value: example.coreData.projectType,
      },
    });
  }

  if (example.coreData.budget !== undefined) {
    patches.push({
      chapter: 'budget',
      delta: {
        path: 'budgetTotaal',
        operation: 'set',
        value: example.coreData.budget,
      },
    });
  }

  if (example.coreData.locatie) {
    patches.push({
      chapter: 'basis',
      delta: {
        path: 'locatie',
        operation: 'set',
        value: example.coreData.locatie,
      },
    });
  }

  // 2. Wishes patches
  for (const wishText of example.wishes) {
    const wish: Wish = {
      id: randomUUID(),
      text: wishText,
      category: categorizeWish(wishText),
      priority: prioritizeWish(wishText),
    };

    patches.push({
      chapter: 'wensen',
      delta: {
        path: 'wishes',
        operation: 'append',
        value: wish,
      },
    });
  }

  // 3. Emotional signals patches (store as metadata)
  if (example.emotionalSignals.length > 0) {
    patches.push({
      chapter: 'basis',
      delta: {
        path: 'emotionalSignals',
        operation: 'set',
        value: example.emotionalSignals,
      },
    });
  }

  return patches;
}

/**
 * Categorize a wish based on keywords (simple heuristic)
 */
function categorizeWish(wishText: string): WishCategory {
  const lower = wishText.toLowerCase();

  if (/(warm|koel|temperatuur|ventilatie|licht|geluid)/i.test(lower)) {
    return 'comfort';
  }

  if (/(mooi|stijl|design|modern|klassiek|uitstraling)/i.test(lower)) {
    return 'style';
  }

  if (/(functie|gebruik|praktisch|opslag|ruimte)/i.test(lower)) {
    return 'function';
  }

  return 'other';
}

/**
 * Determine priority based on keywords (simple heuristic)
 */
function prioritizeWish(wishText: string): WishPriority {
  const lower = wishText.toLowerCase();

  if (/(moet|noodzakelijk|essentieel|verplicht|belangrijk)/i.test(lower)) {
    return 'must';
  }

  if (/(graag|zou fijn|liefst|bij voorkeur)/i.test(lower)) {
    return 'nice';
  }

  return 'optional';
}
