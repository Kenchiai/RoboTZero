import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { catalogs } from './index';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|svelte)$/.test(name) && !name.endsWith('.test.ts') ? [full] : [];
  });
}

function usedKeys(): string[] {
  const keys = new Set<string>();
  for (const file of sourceFiles(srcRoot)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*'([^']+)'/g)) keys.add(match[1]);
    for (const match of source.matchAll(/titleKey:\s*'([^']+)'/g)) keys.add(match[1]);
  }
  return [...keys].sort();
}

describe('studio.i18n.catalog', () => {
  it('pt-BR e en têm as mesmas chaves', () => {
    expect(Object.keys(catalogs.en).sort()).toEqual(Object.keys(catalogs['pt-BR']).sort());
  });

  it('toda chave usada existe e toda chave existente é usada', () => {
    expect(usedKeys()).toEqual(Object.keys(catalogs['pt-BR']).sort());
  });
});
