import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { readBoard } from './board';

const modelUrl = new URL('../../public/models/c3-devkit-v1.gltf', import.meta.url);

function parse(): Promise<GLTF> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) =>
    loader.parse(readFileSync(modelUrl, 'utf8'), '', resolve, reject),
  );
}

describe('studio.board.gltf', () => {
  it('carrega o board e resolve LED + GPIO', async () => {
    const gltf = await parse();
    const board = readBoard(gltf.scene);

    expect(board.led.gpio).toBe(8);
    expect(board.led.mesh.material).toBeInstanceOf(MeshStandardMaterial);

    const position = new Box3().setFromObject(board.led.mesh).getCenter(new Vector3());
    expect(position.x).toBeGreaterThan(0);
    expect(position.x).toBeLessThan(25.4);
  });

  it('declara unidade, origem e dimensões nos metadados', async () => {
    const gltf = await parse();
    const extras = gltf.scene.userData as {
      boardId: string;
      unit: string;
      dimensions: { width: number; depth: number; height: number };
    };

    expect(extras.boardId).toBe('c3-devkit-v1');
    expect(extras.unit).toBe('mm');
    expect(extras.dimensions.width).toBeCloseTo(25.4, 1);
    expect(extras.dimensions.depth).toBeCloseTo(54.4, 1);
  });

  it('recusa modelo sem LED_USER ou sem gpio', () => {
    expect(() => readBoard(new Group())).toThrow(/LED_USER/);

    const root = new Group();
    const led = new Mesh();
    led.name = 'LED_USER';
    root.add(led);
    expect(() => readBoard(root)).toThrow(/gpio/);
  });

  it('o hash do arquivo bate com a proveniência', () => {
    const provenance = readFileSync(
      new URL('../../../../provenance/board-c3-devkit-v1.yaml', import.meta.url),
      'utf8',
    );
    const sha = /^sha256:\s*"([0-9a-f]{64})"/m.exec(provenance)?.[1];
    const actual = createHash('sha256').update(readFileSync(modelUrl)).digest('hex');

    expect(actual).toBe(sha);
  });
});
