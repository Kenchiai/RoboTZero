import { Group, Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface BoardModel {
  root: Group;
  led: { mesh: Mesh; gpio: number };
}

/** Valida o contrato do modelo (E0-06) e devolve o nó do LED já resolvido. */
export function readBoard(root: Group): BoardModel {
  const led = root.getObjectByName('LED_USER');
  if (!(led instanceof Mesh)) {
    throw new Error('board glTF sem o nó LED_USER');
  }
  const gpio = (led.userData as { gpio?: unknown }).gpio;
  if (typeof gpio !== 'number') {
    throw new Error('LED_USER sem o metadado gpio');
  }
  return { root, led: { mesh: led, gpio } };
}

export async function loadBoard(url: string): Promise<BoardModel> {
  const gltf = await new GLTFLoader().loadAsync(url);
  return readBoard(gltf.scene);
}
