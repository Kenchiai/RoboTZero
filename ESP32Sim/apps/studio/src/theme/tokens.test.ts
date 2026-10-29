import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokensFile = path.join(srcRoot, 'theme', 'tokens.css');
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (full === tokensFile || name.endsWith('.test.ts')) return [];
    return /\.(ts|svelte|css)$/.test(name) ? [full] : [];
  });
}

describe('studio.theme.tokens', () => {
  it('nenhuma cor literal fora do arquivo de tokens', () => {
    const offenders = sourceFiles(srcRoot)
      .filter((file) => COLOR_LITERAL.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(srcRoot, file));

    expect(offenders).toEqual([]);
  });
});
