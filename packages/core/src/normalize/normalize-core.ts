import type { RawDocument } from '../parsers/raw-document.js';
import type { CustomerCoreData } from '../types/customer-example.js';

/**
 * Extracts core customer data from the document using heuristics
 */
export function extractCoreData(doc: RawDocument): CustomerCoreData {
  const text = doc.text.toLowerCase();
  const coreData: CustomerCoreData = {};

  // Extract budget
  coreData.budget = extractBudget(text);

  // Extract project type
  coreData.projectType = extractProjectType(text);

  // Extract locatie
  coreData.locatie = extractLocatie(doc.text); // Use original casing for location

  return coreData;
}

function extractBudget(text: string): number | undefined {
  // Match patterns like: € 250.000, €250000, 250k, 250.000 euro, etc.
  const patterns = [
    /€\s*(\d+)\.(\d+)\.(\d+)/,  // € 250.000.000
    /€\s*(\d+)\.(\d+)/,          // € 250.000
    /€\s*(\d+)k/i,               // € 250k
    /(\d+)k(?:\s|$)/i,           // 350k (standalone)
    /(\d+)\.(\d+)\s*euro/i,      // 250.000 euro
    /(\d+)k\s*euro/i,            // 250k euro
    /budget.*?(\d+)\.(\d+)/i,    // budget van 250.000
    /budget.*?(\d+)k/i,          // budget van 250k
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract number and convert to actual value
      const cleanNumber = match[0]
        .replace(/€/g, '')
        .replace(/euro/gi, '')
        .replace(/budget/gi, '')
        .replace(/\s/g, '')
        .toLowerCase()
        .trim();

      if (cleanNumber.includes('k')) {
        // Handle 250k format
        const num = parseInt(cleanNumber.replace('k', ''), 10);
        if (!isNaN(num) && num > 0) {
          return num * 1000;
        }
      } else {
        // Handle 250.000 format
        const num = parseInt(cleanNumber.replace(/\./g, ''), 10);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }
  }

  return undefined;
}

function extractProjectType(text: string): string | undefined {
  const projectTypes = [
    { pattern: /nieuwbouw/i, type: 'nieuwbouw' },
    { pattern: /verbouwing/i, type: 'verbouwing' },
    { pattern: /verbouwen/i, type: 'verbouwing' },
    { pattern: /aanbouw/i, type: 'aanbouw' },
    { pattern: /renovatie/i, type: 'renovatie' },
    { pattern: /renoveren/i, type: 'renovatie' },
    { pattern: /uitbouw/i, type: 'uitbouw' },
    { pattern: /dakopbouw/i, type: 'dakopbouw' },
    { pattern: /verbouwproject/i, type: 'verbouwing' },
  ];

  for (const { pattern, type } of projectTypes) {
    if (pattern.test(text)) {
      return type;
    }
  }

  return undefined;
}

function extractLocatie(text: string): string | undefined {
  // Match patterns like: "in Amsterdam", "te Utrecht", "woonachtig in Rotterdam"
  // Use word boundaries and non-greedy matching to avoid capturing too much
  const patterns = [
    /(?:in|te)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?=\s|$|[,.\n])/,
    /(?:woonachtig in|gelegen in|locatie)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?=\s|$|[,.\n])/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Nederland/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}
