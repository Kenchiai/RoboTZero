import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { catalogs } from '../i18n';
import { loadPanel, PANELS } from './catalog';

const panelsDir = path.dirname(fileURLToPath(import.meta.url));

const panelDirectories = readdirSync(panelsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(path.join(panelsDir, entry.name, 'index.ts')))
  .map((entry) => entry.name)
  .sort();

describe('studio.catalog.ids', () => {
  it('IDs são únicos', () => {
    const ids = PANELS.map((panel) => panel.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo diretório de painel está no catálogo', () => {
    const ids = PANELS.map((panel) => panel.id).sort();
    expect(ids).toEqual(panelDirectories);
  });

  it('todo ID tem módulo e título traduzido', () => {
    for (const panel of PANELS) {
      expect(existsSync(path.join(panelsDir, panel.id, 'index.ts'))).toBe(true);
      expect(catalogs['pt-BR']).toHaveProperty(panel.titleKey);
      expect(catalogs.en).toHaveProperty(panel.titleKey);
    }
  });

  it('carrega o módulo do painel sob demanda', async () => {
    const panel = await loadPanel('scene');
    expect(panel.mount).toBeTypeOf('function');
  });
});
