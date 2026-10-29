// Copia o artefato WASM e o Worker do core para o diretório público do studio.
// O `.wasm` é gerado por `cmake --build --preset wasm` (BUILD.md); sem ele o
// build do studio passa, mas a página mostra o erro ao carregar o core.

import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const simRoot = path.resolve(here, '../../..');
const destination = path.resolve(here, '..', 'public', 'core');

await mkdir(destination, { recursive: true });
await copyFile(
  path.join(simRoot, 'wasm', 'worker', 'esp32sim.worker.mjs'),
  path.join(destination, 'esp32sim.worker.mjs'),
);

const wasm = path.join(simRoot, 'build', 'wasm', 'wasm', 'esp32sim.wasm');
try {
  await access(wasm);
  await copyFile(wasm, path.join(destination, 'esp32sim.wasm'));
  console.log('core sincronizado: esp32sim.wasm + worker');
} catch {
  console.warn('esp32sim.wasm não encontrado; rode o build WASM (BUILD.md)');
}
