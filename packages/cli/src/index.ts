import { extractFromFile } from '@brikx/extractor-core';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import process from 'process';

type CliOptions = {
  outDir?: string;
  emitUrl?: string;
};

export async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: brikx-extract <inputPath> [--out ./out] [--emit http://localhost:3000/api/events/intake]');
    process.exit(1);
  }

  const inputPath = args[0];
  const options: CliOptions = parseOptions(args.slice(1));

  try {
    console.log(`Processing: ${inputPath}`);

    // Extract data from file
    const result = await extractFromFile(inputPath);

    // 1) Write JSON to output directory (default: ./out)
    const outDir = options.outDir ?? './out';
    await mkdir(outDir, { recursive: true });

    const baseName = basename(inputPath, extname(inputPath));
    const outPath = join(outDir, `${baseName}.extract.json`);

    await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`✓ Written: ${outPath}`);

    // Print summary
    console.log('\nExtraction Summary:');
    console.log(`  Confidence: ${(result.meta.confidence * 100).toFixed(0)}%`);
    console.log(`  Project Type: ${result.customerExample.coreData.projectType || 'N/A'}`);
    console.log(`  Budget: ${result.customerExample.coreData.budget ? `€${result.customerExample.coreData.budget.toLocaleString('nl-NL')}` : 'N/A'}`);
    console.log(`  Location: ${result.customerExample.coreData.locatie || 'N/A'}`);
    console.log(`  Wishes: ${result.customerExample.wishes.length}`);
    console.log(`  Emotional Signals: ${result.customerExample.emotionalSignals.length}`);
    console.log(`  Patches: ${result.patches.length}`);

    if (result.meta.warnings && result.meta.warnings.length > 0) {
      console.log('\nWarnings:');
      result.meta.warnings.forEach(w => console.log(`  - ${w}`));
    }

    // 2) Optionally emit to Brikx endpoint
    if (options.emitUrl) {
      console.log(`\nEmitting to ${options.emitUrl}...`);

      const res = await fetch(options.emitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`✗ Emit failed: ${res.status} ${res.statusText}`);
        console.error(`  ${errorText}`);
        process.exitCode = 1;
      } else {
        console.log(`✓ Emitted successfully`);
      }
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function parseOptions(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--out' && args[i + 1]) {
      options.outDir = args[++i];
    } else if (a === '--emit' && args[i + 1]) {
      options.emitUrl = args[++i];
    }
  }
  return options;
}
