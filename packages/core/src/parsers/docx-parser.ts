import mammoth from 'mammoth';
import type { RawDocument } from './raw-document.js';

export async function parseDocxFile(filePath: string): Promise<RawDocument> {
  const result = await mammoth.extractRawText({ path: filePath });

  return {
    sourceFile: filePath,
    text: result.value,
  };
}
