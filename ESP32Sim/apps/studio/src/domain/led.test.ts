import { describe, expect, it } from 'vitest';
import { EVENT } from '../../../../wasm/worker/ring.mjs';
import type { SimEvent } from './events';
import { createLedState, LED_GPIO, levelFromPayload, reduceFrame } from './led';

const pin = (code: number, payload: bigint): SimEvent => ({
  type: EVENT.PIN_CHANGE,
  code,
  cycle: 0n,
  payload,
});

describe('studio.frame.coalesce', () => {
  it('N eventos de pino no frame produzem uma única mudança', () => {
    const state = createLedState();

    const result = reduceFrame(state, [
      pin(LED_GPIO, 1n),
      pin(LED_GPIO, 0n),
      pin(LED_GPIO, 1n),
    ]);

    expect(result).toEqual({ on: true, changed: true });
  });

  it('ignora outros pinos e eventos que não são PIN_CHANGE', () => {
    const state = createLedState();
    const result = reduceFrame(state, [
      pin(9, 1n),
      { type: EVENT.TRACE_MARK, code: LED_GPIO, cycle: 0n, payload: 1n },
    ]);

    expect(result).toEqual({ on: false, changed: false });
  });

  it('não muda quando o nível repete', () => {
    const state = createLedState();
    state.on = true;

    expect(reduceFrame(state, [pin(LED_GPIO, 1n)])).toEqual({ on: true, changed: false });
  });
});

describe('led payload', () => {
  it('usa o bit 0', () => {
    expect(levelFromPayload(0n)).toBe(false);
    expect(levelFromPayload(1n)).toBe(true);
    expect(levelFromPayload(0xffffn)).toBe(true);
  });
});
