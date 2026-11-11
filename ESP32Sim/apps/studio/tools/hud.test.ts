// AP-02/AP-06: o HUD de contadores não é região viva. Ele é reescrito a cada
// 250 ms; `aria-live` ali faria o leitor de tela anunciar ciclos sem parar. O
// status (carregando/pronto/erro) é a única região anunciada.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const APP = join(fileURLToPath(new URL('..', import.meta.url)), 'src', 'App.svelte');

test('o HUD de contadores fica fora da região viva', () => {
  const app = readFileSync(APP, 'utf8');
  const hud = /<p id="hud"[^>]*>/.exec(app)?.[0];
  assert.ok(hud, 'elemento #hud ausente');
  assert.doesNotMatch(hud, /aria-live|role="status"/, '#hud não pode ser região viva');

  const live = [...app.matchAll(/<p[^>]*role="status"[^>]*>/g)].map((match) => match[0]);
  assert.equal(live.length, 1, 'exatamente um role="status"');
  assert.match(live[0], /id="status"/);
  assert.doesNotMatch(
    app,
    /aria-live=/,
    'role="status" já implica aria-live="polite"; não repita no markup',
  );
});
