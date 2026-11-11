// Gera public/THIRD_PARTY_LICENSES.txt: os avisos que precisam acompanhar o
// studio publicado. O bundle embute three.js e Svelte minificados e o `.wasm`
// embute o runtime/emmalloc do Emscripten — as três licenças exigem o aviso.
// Fonte de cada texto: o próprio arquivo da dependência instalada, exceto o
// Emscripten, que não fica em node_modules.
//
// `npm run notices` escreve; `--check` falha se o arquivo versionado estiver
// desatualizado (usado no prebuild e no teste).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STUDIO = join(HERE, '..');
const PROJECT = join(STUDIO, '..', '..');

export const OUTPUT = join(STUDIO, 'public', 'THIRD_PARTY_LICENSES.txt');

// Versão do emsdk que compila o `.wasm` distribuído. Precisa casar com
// `EMSDK_VERSION` no workflow do CI e com `BUILD.md`; o teste em
// `notices.test.ts` falha se divergirem. Mudar aqui exige regerar o arquivo.
export const EMSCRIPTEN_VERSION = '6.0.13';

// MIT do Emscripten (a outra opção é a UIUC/NCSA; o texto abaixo basta).
const EMSCRIPTEN = `Copyright (c) 2010-2014 Emscripten authors, see AUTHORS file.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`;

function text(path) {
  return readFileSync(path, 'utf8');
}

function version(pkg) {
  return JSON.parse(text(join(STUDIO, 'node_modules', pkg, 'package.json'))).version;
}

function section(title, url, body) {
  const rule = '='.repeat(78);
  return [rule, title, url, rule, '', body.trim(), ''].join('\n');
}

/** Conteúdo completo do arquivo; puro para o teste comparar com o versionado. */
export function render() {
  const blocks = [
    'ESP32Sim — licenças e avisos de terceiros',
    '',
    'Gerado por apps/studio/tools/gen-notices.mjs. Não edite à mão.',
    'Este arquivo acompanha o studio publicado (dist/THIRD_PARTY_LICENSES.txt).',
    '',
    section(
      `ESP32Sim — MIT`,
      'https://github.com/Kenchiai/RoboTZero',
      text(join(PROJECT, 'LICENSE')),
    ),
    section(
      `three.js ${version('three')} — MIT`,
      'https://github.com/mrdoob/three.js',
      text(join(STUDIO, 'node_modules', 'three', 'LICENSE')),
    ),
    section(
      `Svelte ${version('svelte')} — MIT`,
      'https://github.com/sveltejs/svelte',
      text(join(STUDIO, 'node_modules', 'svelte', 'LICENSE.md')),
    ),
    section(
      `Emscripten ${EMSCRIPTEN_VERSION} (runtime e emmalloc dentro de esp32sim.wasm) — MIT ou UIUC/NCSA`,
      'https://github.com/emscripten-core/emscripten',
      EMSCRIPTEN,
    ),
  ];
  return `${blocks.join('\n')}\n`;
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const rendered = render();
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = text(OUTPUT);
    } catch {
      console.error('THIRD_PARTY_LICENSES.txt ausente: rode `npm run notices`.');
      process.exit(1);
    }
    if (current !== rendered) {
      console.error(
        'THIRD_PARTY_LICENSES.txt desatualizado: rode `npm run notices` e revise o diff.',
      );
      process.exit(1);
    }
    console.log('THIRD_PARTY_LICENSES.txt atualizado.');
  } else {
    writeFileSync(OUTPUT, rendered);
    console.log(`escrito ${OUTPUT}`);
  }
}
