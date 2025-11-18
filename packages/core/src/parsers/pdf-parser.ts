import { readFile } from 'fs/promises';
import pdfParse from 'pdf-parse';
import type { RawDocument } from './raw-document.js';

export async function parsePdfFile(filePath: string): Promise<RawDocument> {
  const dataBuffer = await readFile(filePath);
  const data = await pdfParse(dataBuffer);

  const extractedText = data.text || '';
  const numPages = data.numpages || 0;

  // Log basic info
  console.log(`[PDF] Extracted ${extractedText.length} characters from ${numPages} pages`);

  // Only warn if NO text was found at all
  if (extractedText.length === 0) {
    console.error(`❌ [PDF] Geen tekst gevonden in PDF`);
    console.error(`❌ [PDF] Mogelijke oorzaken:`);
    console.error(`   - PDF bevat alleen afbeeldingen (gescande documenten)`);
    console.error(`   - PDF is beveiligd/encrypted`);
    console.error(`   - PDF gebruikt een niet-ondersteund formaat`);
    console.error(`   - Gebruik OCR software om tekst uit afbeeldingen te halen`);
  } else if (extractedText.length < 100 && numPages > 0) {
    // Very little text extracted - likely an issue
    console.warn(
      `⚠️  [PDF] Zeer weinig tekst gevonden (${extractedText.length} chars voor ${numPages} pagina's)`
    );
    console.warn(
      `⚠️  [PDF] Als dit een gescand document is, gebruik dan OCR om tekst te extraheren`
    );
  }
  // Note: PDFs with many images (reference photos) will have low text per page - this is normal for PvE docs

  return {
    sourceFile: filePath,
    text: extractedText,
  };
}
