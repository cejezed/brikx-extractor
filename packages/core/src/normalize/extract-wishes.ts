import type { RawDocument } from '../parsers/raw-document.js';

/**
 * Extracts wishes from the document based on common patterns
 */
export function extractWishes(doc: RawDocument): string[] {
  const text = doc.text;
  const wishes: string[] = [];

  // Split into sentences (simple approach)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments

  // Patterns that indicate wishes/desires
  const wishPatterns = [
    /(?:we|ik|wij)\s+(?:willen|zou graag|zouden graag|wil|willen graag)/i,
    /(?:ons|mijn|onze)\s+(?:doel|wens|verlangen|voorkeur)\s+(?:is|zijn)/i,
    /(?:graag|liefst|bij voorkeur)/i,
    /(?:belangrijk|essentieel|noodzakelijk)\s+(?:is|zijn|dat)/i,
    /(?:we|ik|wij)\s+(?:hopen|verwachten|zoeken)/i,
    /(?:het moet|dit moet|er moet)/i,
  ];

  for (const sentence of sentences) {
    for (const pattern of wishPatterns) {
      if (pattern.test(sentence)) {
        // Clean up the sentence
        const cleanedWish = sentence
          .trim()
          .replace(/^\s*[-•*]\s*/, '') // Remove bullet points
          .trim();

        if (cleanedWish && !wishes.includes(cleanedWish)) {
          wishes.push(cleanedWish);
        }
        break; // Don't add the same sentence multiple times
      }
    }
  }

  return wishes;
}
