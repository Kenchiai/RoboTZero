#!/usr/bin/env node
// Smoke do deploy do studio (E0-07): confere que o Pages entrega o HTML com
// cross-origin isolation, CSP estrita e os assets com o content-type certo.
//
// Node puro, zero dependências: `fetch` e `node:fs` bastam.
//
//   node tools/smoke.mjs --url http://127.0.0.1:8788 --dist dist
//   node tools/smoke.mjs --url https://esp32sim.pages.dev [--verbose]
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const TIMEOUT_MS = 15_000;

const ISOLATION = {
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
  'cross-origin-resource-policy': 'same-origin',
};

// Diretiva → fontes exigidas. `forbidden` lista tokens que não podem aparecer.
const CSP_REQUIRED = {
  'default-src': { sources: ["'self'"] },
  'script-src': { sources: ["'self'", "'wasm-unsafe-eval'"], forbidden: ["'unsafe-eval'", "'unsafe-inline'"] },
  'style-src': { sources: ["'self'", "'unsafe-inline'"] },
  'img-src': { sources: ["'self'", 'data:', 'blob:'] },
  'connect-src': { sources: ["'self'"] },
  'worker-src': { sources: ["'self'"], forbidden: ['blob:'] },
  'frame-ancestors': { sources: ["'none'"] },
  'base-uri': { sources: ["'self'"] },
  'object-src': { sources: ["'none'"] },
  'form-action': { sources: ["'none'"] },
};

const CONTENT_TYPE = {
  '.wasm': ['application/wasm'],
  '.mjs': ['text/javascript', 'application/javascript'],
};

function parseArgs(argv) {
  const options = { url: '', dist: '', verbose: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--url') {
      options.url = argv[(index += 1)] ?? '';
    } else if (arg === '--dist') {
      options.dist = argv[(index += 1)] ?? '';
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
    } else {
      fail(`argumento desconhecido: ${arg}`);
    }
  }
  if (!options.url) {
    fail('falta --url <base>');
  }
  options.url = options.url.replace(/\/+$/, '');
  return options;
}

function usage() {
  console.log('uso: node tools/smoke.mjs --url <base> [--dist <dir>] [--verbose]');
  console.log('  --url    base do deploy (ex.: http://127.0.0.1:8788, https://esp32sim.pages.dev)');
  console.log('  --dist   diretório de build; descobre *.wasm/*.mjs de assets/ e confere cada um');
  console.log('  --verbose  imprime os headers recebidos em /');
  process.exit(0);
}

function fail(message) {
  console.error(`smoke: ${message}`);
  process.exit(1);
}

let passed = 0;
const failures = [];

function ok(name) {
  passed += 1;
  console.log(`ok   ${name}`);
}

function bad(name, detail, hint) {
  failures.push(`${name}\n       → ${detail}\n       → ${hint}`);
  console.log(`FAIL ${name}`);
}

async function get(url) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const headers = Object.fromEntries(
      [...response.headers].map(([key, value]) => [key.toLowerCase(), value]),
    );
    return { status: response.status, headers };
  } catch (error) {
    // Servidor fora do ar vira falha com mensagem, não stack trace.
    return { status: 0, headers: {}, error: error.cause?.code ?? error.message };
  }
}

function expectReachable(result, label) {
  if (result.error === undefined) {
    return true;
  }
  bad(label, `falha de rede (${result.error})`, 'confira se o servidor está no ar e se --url aponta para a base certa');
  return false;
}

function expectHeader(headers, name, expected, label) {
  const actual = headers[name];
  if (actual === undefined) {
    bad(`${label}: ${name}`, 'header ausente', `acrescente "${name}: ${expected}" em apps/studio/public/_headers`);
    return false;
  }
  if (actual.trim() !== expected) {
    bad(`${label}: ${name}`, `recebido "${actual}", esperado "${expected}"`, 'corrija o valor em apps/studio/public/_headers');
    return false;
  }
  return true;
}

function expectIsolation(headers, label) {
  let good = true;
  for (const [name, expected] of Object.entries(ISOLATION)) {
    good = expectHeader(headers, name, expected, label) && good;
  }
  return good;
}

function parseCsp(value) {
  const directives = new Map();
  for (const part of value.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) {
      directives.set(name.toLowerCase(), sources);
    }
  }
  return directives;
}

function expectCsp(headers, label) {
  const raw = headers['content-security-policy'];
  if (raw === undefined) {
    bad(`${label}: Content-Security-Policy`, 'header ausente', 'acrescente a CSP em apps/studio/public/_headers');
    return false;
  }
  const directives = parseCsp(raw);
  let good = true;
  for (const [name, rule] of Object.entries(CSP_REQUIRED)) {
    const sources = directives.get(name);
    if (sources === undefined) {
      bad(`${label}: CSP ${name}`, 'diretiva ausente', `acrescente "${name} ...;" à CSP em apps/studio/public/_headers`);
      good = false;
      continue;
    }
    for (const source of rule.sources) {
      if (!sources.includes(source)) {
        bad(`${label}: CSP ${name}`, `fonte "${source}" ausente em "${sources.join(' ')}"`, `acrescente "${source}" a ${name} em apps/studio/public/_headers`);
        good = false;
      }
    }
    for (const source of rule.forbidden ?? []) {
      if (sources.includes(source)) {
        bad(`${label}: CSP ${name}`, `fonte proibida "${source}" presente`, `remova "${source}" de ${name}: ${source === 'blob:' ? 'o worker é asset same-origin' : 'não é necessário para o bundle'}`);
        good = false;
      }
    }
  }
  return good;
}

function expectCacheControl(headers, expectedFragment, label) {
  const actual = headers['cache-control'];
  if (actual === undefined) {
    bad(`${label}: Cache-Control`, 'header ausente', 'defina Cache-Control em apps/studio/public/_headers');
    return false;
  }
  if (!actual.toLowerCase().includes(expectedFragment)) {
    bad(`${label}: Cache-Control`, `recebido "${actual}", esperado conter "${expectedFragment}"`, 'corrija a regra de cache em apps/studio/public/_headers');
    return false;
  }
  return true;
}

async function checkDocument(base, verbose) {
  const label = 'GET /';
  const result = await get(`${base}/`);
  const { status, headers } = result;
  if (!expectReachable(result, label)) {
    return;
  }
  if (status !== 200) {
    bad(label, `status ${status}`, 'o deploy precisa servir index.html em /');
    return;
  }
  let good = expectIsolation(headers, label);
  good = expectCsp(headers, label) && good;
  good = expectHeader(headers, 'x-content-type-options', 'nosniff', label) && good;
  good = expectHeader(headers, 'referrer-policy', 'no-referrer', label) && good;
  good = expectCacheControl(headers, 'no-cache', label) && good;
  if (good) {
    ok(label);
  }
  if (verbose) {
    console.log('\nheaders de /');
    for (const [name, value] of Object.entries(headers).sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`  ${name}: ${value}`);
    }
    console.log('');
  }
}

async function checkBoard(base) {
  const label = 'GET /board/c3-devkitm1.gltf';
  const result = await get(`${base}/board/c3-devkitm1.gltf`);
  const { status, headers } = result;
  if (!expectReachable(result, label)) {
    return;
  }
  if (status !== 200) {
    bad(label, `status ${status}`, 'o build precisa copiar public/board para dist/board');
    return;
  }
  const good = expectCacheControl(headers, 'max-age=86400', label);
  if (good) {
    ok(label);
  }
}

async function listAssets(directory) {
  const found = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await listAssets(path)));
    } else if (/\.(wasm|mjs)$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

async function checkAssets(base, dist) {
  const assetsDir = join(dist, 'assets');
  const assets = await listAssets(assetsDir);
  if (assets.length === 0) {
    bad(`GET ${relative(process.cwd(), assetsDir)}`, 'nenhum *.wasm/*.mjs encontrado', 'rode npm run build antes do smoke ou aponte --dist para o diretório de build');
    return;
  }
  for (const asset of assets) {
    const path = `/${relative(dist, asset).replaceAll('\\', '/')}`;
    const label = `GET ${path}`;
    const result = await get(`${base}${path}`);
    const { status, headers } = result;
    if (!expectReachable(result, label)) {
      continue;
    }
    if (status !== 200) {
      bad(label, `status ${status}`, 'o asset do build não foi publicado; confira se dist/ foi o diretório enviado ao Pages');
      continue;
    }
    const extension = asset.slice(asset.lastIndexOf('.'));
    const contentType = (headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    const accepted = CONTENT_TYPE[extension] ?? [];
    if (!accepted.includes(contentType)) {
      bad(`${label}: Content-Type`, `recebido "${contentType}", esperado ${accepted.join(' ou ')}`, 'o Pages infere pelo sufixo; confira o nome do arquivo em dist/assets');
      continue;
    }
    if (!expectIsolation(headers, label)) {
      continue;
    }
    if (!expectCacheControl(headers, 'immutable', label)) {
      continue;
    }
    ok(label);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(`smoke: ${options.url}${options.dist ? ` (dist: ${options.dist})` : ''}\n`);
  await checkDocument(options.url, options.verbose);
  await checkBoard(options.url);
  if (options.dist) {
    await checkAssets(options.url, options.dist);
  }
  if (failures.length > 0) {
    console.error(`\n${failures.length} falha(s):\n`);
    for (const failure of failures) {
      console.error(`  ${failure}\n`);
    }
    console.error(`ok: ${passed}, falhas: ${failures.length}`);
    process.exit(1);
  }
  console.log(`\nok: ${passed}`);
}

await main();
