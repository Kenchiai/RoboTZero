import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(srcRoot, 'main.ts');

const IMPORT = /(?:^|\n)\s*import\s+(?:[^;'"]*?\sfrom\s*)?['"]([^'"]+)['"]/g;

function staticImports(file: string): string[] {
  const source = readFileSync(file, 'utf8').replace(/^\s*import\s+type\s[^;]*;?\s*$/gm, '');
  return [...source.matchAll(IMPORT)].map((match) => match[1]);
}

function resolveLocal(from: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(from), specifier);
  return [base, `${base}.ts`, `${base}.js`, `${base}.mjs`, path.join(base, 'index.ts')].find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
}

function staticGraph(file: string): { files: string[]; packages: string[] } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [file];

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (files.has(current)) continue;
    files.add(current);

    for (const specifier of staticImports(current)) {
      if (!specifier.startsWith('.')) {
        packages.add(specifier);
        continue;
      }
      const resolved = resolveLocal(current, specifier);
      if (resolved && resolved.startsWith(srcRoot)) {
        queue.push(resolved);
      }
    }
  }

  return { files: [...files], packages: [...packages] };
}

describe('studio.bundle.initial', () => {
  it('o bundle inicial não importa three.js nem o renderer', () => {
    const graph = staticGraph(entry);

    expect(graph.packages.filter((name) => name === 'three' || name.startsWith('three/'))).toEqual(
      [],
    );
    expect(
      graph.files.filter((file) => file.includes(`${path.sep}render${path.sep}`)),
    ).toEqual([]);
    expect(
      graph.files.filter((file) => file.includes(`${path.sep}panels${path.sep}scene${path.sep}`)),
    ).toEqual([]);
  });

  it('o painel de cena é o único ponto que carrega three.js', async () => {
    const { files, packages } = staticGraph(path.join(srcRoot, 'panels', 'scene', 'index.ts'));
    expect(files.some((file) => file.endsWith(`${path.sep}render${path.sep}scene.ts`))).toBe(true);
    expect(packages.some((name) => name === 'three' || name.startsWith('three/'))).toBe(true);
  });
});
