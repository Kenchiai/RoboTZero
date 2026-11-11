// R-14 de docs/08 §1.3: o manifesto de proveniência tem de casar com o asset.
//
// O glTF é versionado em LF (`.gitattributes`: `*.gltf text eol=lf`). O teste
// confere o hash dos bytes crus: se alguém versionar CRLF, o hash muda e o
// teste falha antes do deploy publicar um asset que não bate com a proveniência.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const STUDIO = fileURLToPath(new URL('..', import.meta.url));
const MANIFEST = `${STUDIO}../../provenance/board-esp32-c3-devkitm-1.yaml`;
const ASSET = `${STUDIO}public/board/c3-devkitm1.gltf`;

const manifest = readFileSync(MANIFEST, 'utf8');

/** Valor de um campo string simples (`nome: "valor"`). */
function quoted(name: string): string {
  const match = manifest.match(new RegExp(`^${name}:\\s*"([^"]*)"`, 'm'));
  assert.ok(match, `campo ${name} ausente no manifesto`);
  return match[1];
}

test('o glTF do board casa com o sha256 do manifesto', () => {
  const asset = readFileSync(ASSET);
  assert.equal(asset.includes(0x0d), false, 'glTF com CRLF: ver `*.gltf text eol=lf`');
  const actual = createHash('sha256').update(asset).digest('hex');
  assert.equal(actual, quoted('sha256'), 'asset mudou sem atualizar o manifesto');
});

test('o manifesto não está pendente e libera a distribuição', () => {
  // Licença em aberto bloqueia o deploy (docs/08 §8): exigir identificador.
  assert.match(quoted('license'), /^[A-Za-z0-9.+-]+$/, 'license não é um identificador SPDX');
  assert.match(manifest, /^allowed_in_distribution:\s*true$/m, 'asset não liberado para distribuição');
  assert.doesNotMatch(quoted('reviewed_by'), /^pendente/i, 'manifesto sem parecer do clean-room');
});
