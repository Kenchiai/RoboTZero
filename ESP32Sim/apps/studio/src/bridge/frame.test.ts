import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const runtimeModules = ['./simulation.ts', '../domain/led.ts', '../render/scene.ts'];

describe('studio.frame.no-store-write', () => {
  it('o caminho de frame não importa Svelte nem escreve em store', () => {
    for (const module of runtimeModules) {
      const source = readFileSync(new URL(module, import.meta.url), 'utf8');
      expect(source, module).not.toMatch(/from\s+['"]svelte/);
      expect(source, module).not.toMatch(/\$(state|derived|effect)\s*\(/);
      expect(source, module).not.toMatch(/\bwritable\s*\(/);
    }
  });
});
