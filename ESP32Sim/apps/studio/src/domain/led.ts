import { EVENT } from '../../../../wasm/worker/ring.mjs';
import type { SimEvent } from './events';

// GPIO do LED de usuário no board c3-devkit-v1 (ver tools/gen).
export const LED_GPIO = 8;

export interface LedState {
  on: boolean;
  gpio: number;
}

export function createLedState(gpio = LED_GPIO): LedState {
  return { on: false, gpio };
}

/** `PIN_CHANGE`: payload bit 0 é o nível. O resto fica reservado. */
export function levelFromPayload(payload: bigint): boolean {
  return (payload & 1n) !== 0n;
}

/**
 * Coalesce os eventos de um frame em um único estado. N eventos de pino
 * produzem no máximo uma mudança visível (AP-02).
 */
export function reduceFrame(
  state: LedState,
  events: Iterable<SimEvent>,
): { on: boolean; changed: boolean } {
  let on = state.on;
  for (const event of events) {
    if (event.type !== EVENT.PIN_CHANGE || event.code !== state.gpio) continue;
    on = levelFromPayload(event.payload);
  }
  return { on, changed: on !== state.on };
}
