import { drain, dropped, EVENT } from '../../../../wasm/worker/ring.mjs';
import type { SimEvent } from '../domain/events';
import { createLedState, LED_GPIO, reduceFrame, type LedState } from '../domain/led';

export interface SimulationState extends LedState {
  dropped: number;
}

interface RingMessage {
  type: 'ring';
  buffer: SharedArrayBuffer;
  ringOffset: number;
  eventsOffset: number;
  capacity: number;
}

type WorkerMessage =
  | { type: 'ready'; abi: number; version: string }
  | RingMessage
  | { type: 'ok'; cycles?: bigint }
  | { type: 'error'; message: string };

export interface BridgeOptions {
  workerUrl: string;
  wasmUrl: string;
  capacity?: number;
  onError?: (error: unknown) => void;
}

/**
 * Bridge do studio (AP-02): o estado de simulação vive aqui, fora do Svelte, e
 * é atualizado uma vez por frame. A UI só vê mudanças discretas de status.
 */
export class SimulationBridge {
  readonly state: SimulationState = { ...createLedState(LED_GPIO), dropped: 0 };

  #options: BridgeOptions;
  #worker?: Worker;
  #ring?: RingMessage;

  constructor(options: BridgeOptions) {
    this.#options = options;
  }

  async start(): Promise<{ abi: number; version: string }> {
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error(
        'SharedArrayBuffer indisponível: falta cross-origin isolation (COOP/COEP)',
      );
    }

    const response = await fetch(this.#options.wasmUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`${this.#options.wasmUrl}: HTTP ${response.status}`);
    }
    const bytes = await response.arrayBuffer();

    const worker = new Worker(this.#options.workerUrl, { type: 'module' });
    this.#worker = worker;
    worker.addEventListener('message', this.#onMessage);
    worker.addEventListener('error', this.#onWorkerError);

    const ready = this.#next('ready');
    worker.postMessage({ cmd: 'load', bytes }, [bytes]);
    const info = await ready;

    const ring = this.#next('ring');
    worker.postMessage({ cmd: 'init', capacity: this.#options.capacity ?? 1024 });
    this.#ring = await ring;
    if (!(this.#ring.buffer instanceof SharedArrayBuffer)) {
      throw new Error('o core não publicou SharedArrayBuffer');
    }
    return info;
  }

  /** Uma drenagem por frame; devolve quantos eventos saíram do ring. */
  pump(): number {
    const ring = this.#ring;
    if (!ring) return 0;

    const events: SimEvent[] = [];
    const count = drain(ring.buffer, ring.ringOffset, ring.eventsOffset, (event: SimEvent) =>
      events.push(event),
    );

    this.state.on = reduceFrame(this.state, events).on;
    this.state.dropped = dropped(ring.buffer, ring.ringOffset);
    return count;
  }

  /** Hook de teste: só existe até o GPIO do core gerar eventos (E1-02). */
  emitPin(gpio: number, level: boolean): void {
    this.#worker?.postMessage({
      cmd: 'emit',
      type: EVENT.PIN_CHANGE,
      code: gpio,
      payload: level ? 1 : 0,
    });
  }

  dispose(): void {
    this.#worker?.removeEventListener('message', this.#onMessage);
    this.#worker?.removeEventListener('error', this.#onWorkerError);
    this.#worker?.terminate();
    this.#worker = undefined;
    this.#ring = undefined;
  }

  #onMessage = (event: MessageEvent<WorkerMessage>) => {
    if (event.data?.type === 'error') {
      this.#options.onError?.(new Error(event.data.message));
    }
  };

  #onWorkerError = (event: ErrorEvent) => {
    this.#options.onError?.(new Error(event.message));
  };

  #next<T extends WorkerMessage['type']>(
    type: T,
  ): Promise<Extract<WorkerMessage, { type: T }>> {
    const worker = this.#worker;
    if (!worker) throw new Error('worker não iniciado');

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };
      const onMessage = (event: MessageEvent<WorkerMessage>) => {
        if (event.data?.type === 'error') {
          cleanup();
          reject(new Error(event.data.message));
        } else if (event.data?.type === type) {
          cleanup();
          resolve(event.data as Extract<WorkerMessage, { type: T }>);
        }
      };
      const onError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(event.message));
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
    });
  }
}
