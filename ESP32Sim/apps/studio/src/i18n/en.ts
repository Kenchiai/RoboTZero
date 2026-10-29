import type { MessageKey } from './pt-BR';

const en: Record<MessageKey, string> = {
  'status.loading': 'Loading the core…',
  'status.ready': 'Core {version} · ABI {abi}',
  'status.error': 'Studio failure',
  'scene.title': 'Board 3D scene',
  'hook.toggle': 'Toggle GPIO8 (LED)',
  'hook.note': 'Until the core has GPIO (E1-02), the LED reacts to esp32sim_test_emit.',
};

export default en;
