import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import type { RawDocument } from './raw-document.js';

/**
 * Parses Excel files (.xlsx, .xls) and extracts text from all sheets and cells
 */
export async function parseExcelFile(filePath: string): Promise<RawDocument> {
  const buffer = await readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const textParts: string[] = [];

  // Iterate through all sheets
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // Add sheet name as header
    textParts.push(`\n=== ${sheetName} ===\n`);

    // Convert sheet to array of arrays (rows)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    // Process each row
    for (const row of data) {
      if (Array.isArray(row) && row.length > 0) {
        // Join cells with tabs, filter out empty values
        const rowText = row
          .map(cell => String(cell).trim())
          .filter(cell => cell.length > 0)
          .join('\t');

        if (rowText.length > 0) {
          textParts.push(rowText);
        }
      }
    }
  }

  const text = textParts.join('\n');

  return {
    sourceFile: filePath,
    text,
  };
}
