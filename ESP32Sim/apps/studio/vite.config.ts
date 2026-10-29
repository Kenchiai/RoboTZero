import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const here = path.dirname(fileURLToPath(import.meta.url));

// SharedArrayBuffer exige cross-origin isolation; os headers do dev/preview são
// os mesmos que o deploy precisa mandar (docs/03-arquitetura.md §6.3).
const isolation = {
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
  'cross-origin-resource-policy': 'same-origin',
};

export default defineConfig({
  plugins: [svelte()],
  server: {
    headers: isolation,
    // O studio importa o leitor do ring que mora em wasm/worker/ (E0-05).
    fs: { allow: [path.resolve(here, '../..')] },
  },
  preview: { headers: isolation },
  build: { target: 'es2022' },
});
