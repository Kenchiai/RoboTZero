<script lang="ts">
  import { onMount } from 'svelte';
  import { SimulationBridge } from './bridge/simulation';
  import { loadPanel, type PanelHandle } from './panels/catalog';
  import { t } from './i18n';

  let host = $state<HTMLElement>();
  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let detail = $state(t('status.loading'));
  let level = $state(false);

  let bridge: SimulationBridge | undefined;
  let panel: PanelHandle | undefined;

  function showError(error: unknown) {
    status = 'error';
    detail = `${t('status.error')}: ${error instanceof Error ? error.message : String(error)}`;
  }

  onMount(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (!host) throw new Error('host da cena ausente');

        bridge = new SimulationBridge({
          wasmUrl: '/core/esp32sim.wasm',
          workerUrl: '/core/esp32sim.worker.mjs',
          onError: showError,
        });

        const scene = await loadPanel('scene');
        if (cancelled) return;
        panel = scene.mount(host, {
          boardUrl: '/models/c3-devkit-v1.gltf',
          state: bridge.state,
          pump: () => bridge?.pump() ?? 0,
          onError: showError,
        });

        const info = await bridge.start();
        if (cancelled) return;
        status = 'ready';
        detail = t('status.ready', {
          version: info.version,
          abi: `0x${info.abi.toString(16)}`,
        });
      } catch (error) {
        if (!cancelled) showError(error);
      }
    })();

    return () => {
      cancelled = true;
      panel?.dispose();
      bridge?.dispose();
    };
  });

  function toggle() {
    level = !level;
    bridge?.emitPin(8, level);
  }
</script>

<main>
  <header>
    <h1>ESP32Sim</h1>
    <p class:ok={status === 'ready'} class:error={status === 'error'} aria-live="polite">
      {detail}
    </p>
  </header>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex (cena 3D operável por teclado via OrbitControls) -->
  <div
    class="scene"
    bind:this={host}
    role="application"
    tabindex="0"
    aria-label={t('scene.title')}
  ></div>

  <footer>
    <button type="button" onclick={toggle} disabled={status !== 'ready'}>
      {t('hook.toggle')}
    </button>
    <p>{t('hook.note')}</p>
  </footer>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    min-block-size: 100dvh;
  }

  header {
    padding: 1rem 1.5rem;
    border-block-end: 1px solid var(--color-border);
  }

  h1 {
    margin: 0;
    font-size: 1rem;
    letter-spacing: 0.04em;
  }

  header p {
    margin: 0.25rem 0 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  header p.ok {
    color: var(--color-accent);
  }

  header p.error {
    color: var(--color-error);
  }

  .scene {
    position: relative;
    min-block-size: 0;
  }

  .scene:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .scene :global(canvas) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-block-start: 1px solid var(--color-border);
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  button {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--color-accent);
  }

  button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  button:disabled {
    cursor: default;
    opacity: 0.5;
  }

  footer p {
    margin: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none;
      transition: none;
    }
  }
</style>
