<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { connect, type CoreLink } from './bridge/core';
  import { IsolationError } from './bridge/isolation';
  import { t } from './i18n';
  import { isHigh, LED_PIN } from './presentation/pins';
  import { readTokens } from './render/tokens';
  import type { StudioScene } from './render/scene';

  const format = new Intl.NumberFormat();
  const base = import.meta.env.BASE_URL;

  let canvas = $state<HTMLCanvasElement>();
  let hud = $state<HTMLParagraphElement>();
  let link: CoreLink | undefined;
  let scene: StudioScene | undefined;
  let running = false;
  let raf = 0;
  let status = $state(t('status.loading'));
  let led = $state(false);

  onMount(async () => {
    // Referências fixas do mount: o loop não pode depender do estado reativo,
    // que vira nulo no unmount/HMR (AP-02 e ciclo de vida).
    const surface = canvas!;
    const readout = hud;
    try {
      link = await connect();
      // Import dinâmico: three.js fica fora do bundle inicial (AP-01).
      const { createScene } = await import('./render/scene');
      scene = await createScene(
        surface,
        readTokens(),
        matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
      status = t('status.ready');
      running = true;

      let lastHud = 0;
      const frame = (now: number) => {
        if (!running) return;
        const state = link!.frame(500);
        const on = isHigh(state.pins, LED_PIN);
        scene!.setLed(on);
        // Uma leitura por frame; escrita no DOM só quando muda (AP-02).
        if (surface.dataset.led !== (on ? 'on' : 'off')) {
          surface.dataset.led = on ? 'on' : 'off';
        }
        if (readout && now - lastHud > 250) {
          lastHud = now;
          readout.textContent = t('hud', {
            version: link!.version,
            abi: link!.abi.toString(16),
            cycles: format.format(state.cycles),
            events: format.format(state.events),
            dropped: format.format(state.dropped),
            led: t(on ? 'hud.on' : 'hud.off'),
          });
        }
        scene!.render();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    } catch (error) {
      status =
        error instanceof IsolationError
          ? t('status.noIsolation', { requirement: error.requirement })
          : t('status.error', { message: String(error) });
    }
  });

  onDestroy(() => {
    running = false;
    cancelAnimationFrame(raf);
    scene?.dispose();
  });
</script>

<main>
  <header class="bench">
    <label>
      <input
        type="checkbox"
        checked={led}
        onchange={(event) => {
          led = event.currentTarget.checked;
          link?.setPin(LED_PIN, led ? 1 : 0);
        }}
      />
      {t('bench.led', { pin: LED_PIN })}
    </label>
    <p id="status" role="status">{status}</p>
    <!-- Contadores mudam a cada 250 ms: fora da árvore de acessibilidade. -->
    <p id="hud" bind:this={hud} aria-hidden="true"></p>
  </header>
  <canvas bind:this={canvas} aria-label={t('scene.label')} data-led="off"></canvas>
  <footer>
    <p>{t('footer.disclaimer')}</p>
    <a href={`${base}THIRD_PARTY_LICENSES.txt`}>{t('footer.licenses')}</a>
  </footer>
</main>
