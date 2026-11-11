// AP-07: cor só existe em src/styles/tokens.css. A cena e os componentes leem
// os valores por `readTokens()`; este teste falha se aparecer um literal de
// cor em qualquer outro arquivo de `src` ou se o render pedir um token que o
// CSS não define.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const TOKENS_CSS = join(SRC, 'styles', 'tokens.css');

// Hex de 3/4/6/8 dígitos, rgb()/rgba() e hsl()/hsla(). `#app` não casa.
const COLOR = /(?<![\w-])(?:#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()/g;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sources(full);
    }
    // Testes carregam os próprios padrões de detecção; o CSS de tokens é a
    // única exceção permitida.
    if (
      full === TOKENS_CSS ||
      entry.name.endsWith('.test.ts') ||
      !/\.(ts|svelte|css)$/.test(entry.name)
    ) {
      return [];
    }
    return [full];
  });
}

test('nenhum literal de cor fora do arquivo de tokens', () => {
  const offenders = sources(SRC).flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return [...text.matchAll(COLOR)].map((match) => {
      const line = text.slice(0, match.index).split('\n').length;
      return `${file.slice(SRC.length)}:${line} ${match[0]}`;
    });
  });
  assert.deepEqual(offenders, [], 'cor literal fora de tokens.css: use var(--token)');
});

test('o render só lê tokens que o CSS define', () => {
  const css = readFileSync(TOKENS_CSS, 'utf8');
  const tokens = readFileSync(join(SRC, 'render', 'tokens.ts'), 'utf8');
  const used = [...tokens.matchAll(/read\(\s*'(--[\w-]+)'\s*\)/g)].map((match) => match[1]);
  assert.ok(used.length > 0, 'readTokens não lê nenhum token');
  const missing = used.filter((name) => !new RegExp(`${name}\\s*:`).test(css));
  assert.deepEqual(missing, [], 'token lido pelo render mas não definido em tokens.css');
});

test('readTokens relê a paleta a cada chamada (troca de tema)', () => {
  const tokens = readFileSync(join(SRC, 'render', 'tokens.ts'), 'utf8');
  const body = /export function readTokens\(\)[^{]*\{([\s\S]*?)\n\}/.exec(tokens)?.[1];
  assert.ok(body, 'readTokens não encontrado');
  // Se a leitura fosse memoizada no módulo, trocar o tema não atualizaria a cena.
  assert.match(body, /getComputedStyle\(document\.documentElement\)/);
});
