// O `_headers` é o que faz o site publicado ser cross-origin isolated: no
// Pages não existe `vite.config.ts`. Se COOP/COEP/CORP sumirem, o
// `SharedArrayBuffer` deixa de existir e nada falha de forma visível — o core
// só cai para single-thread. Este teste guarda o mínimo que o deploy precisa.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const FILE = join(fileURLToPath(new URL('..', import.meta.url)), 'public', '_headers');

test('o _headers isola a origem e mantém a CSP estrita', () => {
  const headers = readFileSync(FILE, 'utf8');

  for (const needle of [
    'Cross-Origin-Opener-Policy: same-origin',
    'Cross-Origin-Embedder-Policy: require-corp',
    'Cross-Origin-Resource-Policy: same-origin',
    "script-src 'self' 'wasm-unsafe-eval'",
    // O buffer do glTF vem embutido como data URI e o three.js o busca por
    // fetch; `connect-src` sem `data:` quebra a cena.
    "connect-src 'self' data:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ]) {
    assert.ok(headers.includes(needle), `header ausente: ${needle}`);
  }

  assert.ok(
    !/'unsafe-eval'/.test(headers),
    'CSP com unsafe-eval: use wasm-unsafe-eval para o WebAssembly',
  );
});

test('assets com hash ficam imutáveis e o HTML revalida', () => {
  const headers = readFileSync(FILE, 'utf8');
  assert.match(headers, /Cache-Control: public, max-age=0, must-revalidate/);

  const assets = headers.slice(headers.indexOf('/assets/*'));
  assert.ok(assets.length > 0, 'regra /assets/* ausente');
  assert.ok(
    assets.includes('max-age=31536000, immutable'),
    'assets com hash precisam de cache imutável',
  );
});
