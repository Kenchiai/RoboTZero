// O artefato publicado é uma cópia do software: as licenças MIT de three.js e
// Svelte e a do próprio projeto exigem que o aviso acompanhe a cópia. Este
// teste garante que public/THIRD_PARTY_LICENSES.txt existe e está atualizado.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EMSCRIPTEN_VERSION, OUTPUT, render } from './gen-notices.mjs';

const STUDIO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = join(STUDIO, '..', '..');
const REPO = join(PROJECT, '..');

test('o arquivo de licenças acompanha as dependências instaladas', () => {
  assert.equal(readFileSync(OUTPUT, 'utf8'), render(), 'rode `npm run notices`');
});

test('o arquivo de licenças cobre o que é distribuído', () => {
  const notices = readFileSync(OUTPUT, 'utf8');
  for (const needle of [
    'ESP32Sim — MIT',
    'three.js',
    'Svelte',
    'Emscripten',
    'Permission is hereby granted, free of charge',
  ]) {
    assert.ok(notices.includes(needle), `aviso ausente: ${needle}`);
  }
});

// O `.wasm` publicado tem de sair da mesma versão que o aviso cita. São três
// lugares mantidos à mão: o workflow do CI, o BUILD.md e o gerador.
test('a versão do Emscripten casa com o CI e com o BUILD.md', () => {
  const workflow = readFileSync(
    join(REPO, '.github', 'workflows', 'esp32sim-ci.yml'),
    'utf8',
  );
  const build = readFileSync(join(PROJECT, 'BUILD.md'), 'utf8');

  assert.equal(
    /EMSDK_VERSION:\s*'([^']+)'/.exec(workflow)?.[1],
    EMSCRIPTEN_VERSION,
    'EMSDK_VERSION do workflow diverge do aviso do Emscripten',
  );
  assert.equal(
    /\.\/emsdk install (\S+)/.exec(build)?.[1],
    EMSCRIPTEN_VERSION,
    'BUILD.md diverge do aviso do Emscripten',
  );
});
