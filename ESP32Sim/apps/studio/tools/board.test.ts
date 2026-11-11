// O glTF do board é um asset gerado e versionado. O `--check` do prebuild já
// falha se ele divergir do gerador; este teste é a mesma garantia dentro de
// `npm test`, com o diff localizado.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { OUTPUT, render } from './gen-board.mjs';

test('o glTF versionado é o que o gerador produz', () => {
  assert.equal(readFileSync(OUTPUT, 'utf8'), render(), 'rode `npm run board`');
});

test('o glTF não carrega cor: o material é branco neutro (AP-07)', () => {
  const gltf = JSON.parse(render());
  assert.deepEqual(
    gltf.materials[0].pbrMetallicRoughness.baseColorFactor,
    [1, 1, 1, 1],
    'a cor do board vem dos tokens; o asset não pode fixá-la',
  );
});
