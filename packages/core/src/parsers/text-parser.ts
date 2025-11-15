import { readFile } from 'fs/promises';
import type { RawDocument } from './raw-document.js';

export async function parseTextFile(filePath: string): Promise<RawDocument> {
  const text = await readFile(filePath, 'utf-8');

  return {
    sourceFile: filePath,
    text,
  };
}
