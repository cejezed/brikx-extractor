import { readFile } from 'fs/promises';
import pdfParse from 'pdf-parse';
import type { RawDocument } from './raw-document.js';

export async function parsePdfFile(filePath: string): Promise<RawDocument> {
  const dataBuffer = await readFile(filePath);
  const data = await pdfParse(dataBuffer);

  return {
    sourceFile: filePath,
    text: data.text,
  };
}
