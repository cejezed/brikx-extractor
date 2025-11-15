import { extname } from 'path';
import type { RawDocument } from './raw-document.js';
import { parseTextFile } from './text-parser.js';
import { parseDocxFile } from './docx-parser.js';
import { parsePdfFile } from './pdf-parser.js';
import { parseExcelFile } from './excel-parser.js';

export { RawDocument } from './raw-document.js';

/**
 * Parses a file based on its extension and returns a RawDocument
 * Supports: .txt, .docx, .pdf, .xlsx, .xls
 */
export async function parseFile(inputPath: string): Promise<RawDocument> {
  const ext = extname(inputPath).toLowerCase();

  switch (ext) {
    case '.txt':
      return parseTextFile(inputPath);
    case '.docx':
      return parseDocxFile(inputPath);
    case '.pdf':
      return parsePdfFile(inputPath);
    case '.xlsx':
    case '.xls':
      return parseExcelFile(inputPath);
    default:
      throw new Error(`Unsupported file extension: ${ext}. Supported: .txt, .docx, .pdf, .xlsx, .xls`);
  }
}
