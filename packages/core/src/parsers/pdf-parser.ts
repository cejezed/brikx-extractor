import { readFile } from 'fs/promises';
import pdfParse from 'pdf-parse';
import type { RawDocument } from './raw-document.js';

export async function parsePdfFile(filePath: string): Promise<RawDocument> {
  const dataBuffer = await readFile(filePath);
  const data = await pdfParse(dataBuffer);

  const extractedText = data.text || '';
  const numPages = data.numpages || 0;

  // Detect if PDF might be scanned (images) instead of text
  const textPerPage = numPages > 0 ? extractedText.length / numPages : extractedText.length;
  const isSuspectedScannedPdf = numPages > 0 && textPerPage < 100;

  if (isSuspectedScannedPdf) {
    console.warn(
      `⚠️  [PDF] Mogelijk gescande PDF gedetecteerd (${extractedText.length} chars voor ${numPages} pagina's)`
    );
    console.warn(
      `⚠️  [PDF] Als de PDF afbeeldingen/scans bevat, gebruik dan een OCR tool om tekst te extraheren`
    );
  }

  if (extractedText.length === 0) {
    console.error(`❌ [PDF] Geen tekst gevonden in PDF`);
    console.error(`❌ [PDF] Mogelijke oorzaken:`);
    console.error(`   - PDF bevat alleen afbeeldingen (gescande documenten)`);
    console.error(`   - PDF is beveiligd/encrypted`);
    console.error(`   - PDF gebruikt een niet-ondersteund formaat`);
    console.error(`   - Gebruik OCR software om tekst uit afbeeldingen te halen`);
  }

  return {
    sourceFile: filePath,
    text: extractedText,
  };
}
