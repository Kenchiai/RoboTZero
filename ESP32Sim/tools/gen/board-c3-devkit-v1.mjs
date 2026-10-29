#!/usr/bin/env node
// Gera o board glTF do studio (E0-06).
//
// Aproximação funcional das dimensões de um devkit C3: nenhum logotipo,
// serigrafia, arte ou arquivo do produto de referência foi reproduzido. As
// medidas servem para a cena e para o mapeamento do LED; a definição de placa
// completa (pinout, periféricos) entra na Fase 1. Proveniência em
// `provenance/board-c3-devkit-v1.yaml`.
//
// Convenções de docs/03-arquitetura.md §7.3: milímetros, Y para cima, origem
// no canto da placa. glTF 2.0 assume metros; o consumidor converte.
//
//   node tools/gen/board-c3-devkit-v1.mjs           # grava o .gltf
//   node tools/gen/board-c3-devkit-v1.mjs --check   # falha se estiver velho

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(here, '../../apps/studio/public/models/c3-devkit-v1.gltf');

const WIDTH = 25.4;
const DEPTH = 54.4;
const THICKNESS = 1.6;

const MATERIALS = [
  { name: 'pcb', color: [0.106, 0.369, 0.247, 1], roughness: 0.75, metallic: 0 },
  { name: 'metal', color: [0.72, 0.74, 0.76, 1], roughness: 0.35, metallic: 1 },
  { name: 'plastic', color: [0.12, 0.13, 0.14, 1], roughness: 0.6, metallic: 0 },
  { name: 'gold', color: [0.78, 0.62, 0.25, 1], roughness: 0.45, metallic: 1 },
  { name: 'led', color: [0.9, 0.9, 0.88, 1], roughness: 0.3, metallic: 0 },
];

// Normal + tangentes ortogonais (u x v = n) para manter o winding CCW.
const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [0, 1, 0], v: [1, 0, 0] },
];

/** @param {number[]} axis @param {number[]} size */
const extent = (axis, size) =>
  Math.abs(axis[0]) * size[0] + Math.abs(axis[1]) * size[1] + Math.abs(axis[2]) * size[2];

function createBuilder() {
  return { positions: [], normals: [], indices: [], count: 0 };
}

function addBox(builder, center, size) {
  for (const { n, u, v } of FACES) {
    const halfU = extent(u, size) / 2;
    const halfV = extent(v, size) / 2;
    const corner = (su, sv) => [
      center[0] + u[0] * halfU * su + v[0] * halfV * sv,
      center[1] + u[1] * halfU * su + v[1] * halfV * sv,
      center[2] + u[2] * halfU * su + v[2] * halfV * sv,
    ];
    const base = builder.count;
    for (const [su, sv] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      builder.positions.push(...corner(su, sv));
      builder.normals.push(...n);
    }
    builder.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    builder.count += 4;
  }
}

const builders = MATERIALS.map(createBuilder);
const box = (material, center, size) => addBox(builders[material], center, size);

// Corpo: PCB, módulo, conector USB-C, botões e pinos.
box(0, [WIDTH / 2, THICKNESS / 2, DEPTH / 2], [WIDTH, THICKNESS, DEPTH]);
box(1, [WIDTH / 2, THICKNESS + 1, 38], [13.2, 2, 16.6]);
box(2, [WIDTH / 2, THICKNESS + 1.6, 3.75], [9, 3.2, 7.5]);
box(1, [WIDTH / 2, THICKNESS + 0.15, 12.5], [4.2, 0.3, 4.2]);
box(1, [WIDTH / 2, THICKNESS + 0.15, 20.5], [4.2, 0.3, 2.4]);
for (let i = 0; i < 15; i += 1) {
  const z = 8.5 + i * 2.54;
  box(3, [1.5, THICKNESS + 0.15, z], [1.8, 0.3, 1.8]);
  box(3, [WIDTH - 1.5, THICKNESS + 0.15, z], [1.8, 0.3, 1.8]);
}

// LED de usuário: nó próprio para o renderer trocar o material.
const led = createBuilder();
addBox(led, [WIDTH - 4.5, THICKNESS + 0.4, 30], [2, 0.8, 1.6]);

function align4(n) {
  return (n + 3) & ~3;
}

const chunks = [];
const bufferViews = [];
const accessors = [];
let byteLength = 0;

function pushView(array, componentType, type, target) {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const offset = align4(byteLength);
  if (offset > byteLength) {
    chunks.push(Buffer.alloc(offset - byteLength));
    byteLength = offset;
  }
  chunks.push(bytes);
  bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length, target });
  byteLength += bytes.length;
  const accessor = { bufferView: bufferViews.length - 1, componentType, count: 0, type };
  accessors.push(accessor);
  return accessors.length - 1;
}

function addPrimitive(builder, material) {
  const positions = new Float32Array(builder.positions);
  const normals = new Float32Array(builder.normals);
  const indices = new Uint16Array(builder.indices);

  const positionAccessor = pushView(positions, 5126, 'VEC3', 34962);
  accessors[positionAccessor].count = builder.count;
  accessors[positionAccessor].min = [0, 0, 0];
  accessors[positionAccessor].max = [0, 0, 0];
  for (let i = 0; i < builder.positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      accessors[positionAccessor].min[axis] = Math.min(
        accessors[positionAccessor].min[axis],
        builder.positions[i + axis],
      );
      accessors[positionAccessor].max[axis] = Math.max(
        accessors[positionAccessor].max[axis],
        builder.positions[i + axis],
      );
    }
  }
  const normalAccessor = pushView(normals, 5126, 'VEC3', 34962);
  accessors[normalAccessor].count = builder.count;
  const indexAccessor = pushView(indices, 5123, 'SCALAR', 34963);
  accessors[indexAccessor].count = builder.indices.length;

  return {
    attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
    indices: indexAccessor,
    material,
  };
}

const bodyPrimitives = builders.map((builder, material) => addPrimitive(builder, material));
const ledPrimitive = addPrimitive(led, 4);

const gltf = {
  asset: {
    version: '2.0',
    generator: 'esp32sim tools/gen/board-c3-devkit-v1.mjs',
    extras: { origin: 'original' },
  },
  scene: 0,
  scenes: [
    {
      nodes: [0, 1],
      extras: {
        boardId: 'c3-devkit-v1',
        displayName: 'Placa C3 (compatível com ESP32-C3)',
        unit: 'mm',
        dimensions: { width: WIDTH, depth: DEPTH, height: THICKNESS },
      },
    },
  ],
  nodes: [
    { name: 'board.body', mesh: 0 },
    {
      name: 'LED_USER',
      mesh: 1,
      extras: { kind: 'led', id: 'led.user', gpio: 8 },
    },
  ],
  meshes: [
    { name: 'board.body', primitives: bodyPrimitives },
    { name: 'LED_USER', primitives: [ledPrimitive] },
  ],
  materials: MATERIALS.map((material) => ({
    name: material.name,
    pbrMetallicRoughness: {
      baseColorFactor: material.color,
      metallicFactor: material.metallic,
      roughnessFactor: material.roughness,
    },
    emissiveFactor: [0, 0, 0],
  })),
  accessors,
  bufferViews,
  buffers: [
    {
      byteLength,
      uri: `data:application/octet-stream;base64,${Buffer.concat(chunks).toString('base64')}`,
    },
  ],
};

const text = `${JSON.stringify(gltf, null, 2)}\n`;
const check = process.argv.includes('--check');

if (check) {
  const current = await readFile(output, 'utf8').catch(() => '');
  if (current !== text) {
    console.error(`board glTF desatualizado: rode "npm run models" (${output})`);
    process.exit(1);
  }
  console.log('board glTF atualizado');
} else {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, text);
  console.log(`board glTF: ${output} (${text.length} bytes)`);
}
