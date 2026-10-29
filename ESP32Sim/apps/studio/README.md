# Studio (E0-06)

Spike de apresentação do ESP32Sim: Svelte 5 + Vite + TypeScript, com three.js
isolado em `src/render/`. O core roda no Worker (E0-05) e o studio só apresenta
o estado que ele publica.

## Rodar

```bash
npm ci
npm run dev        # http://localhost:5173/
npm test
npm run check
npm run build
npm run preview    # http://localhost:4173/
```

`predev`/`prebuild` geram o board glTF e copiam `esp32sim.wasm` + Worker do core
para `public/core/`. Sem o build WASM a página abre e mostra o erro ao carregar
o core. Ver [`../../BUILD.md`](../../BUILD.md).

## Contratos

- **AP-01**: `src/panels/catalog.ts` é o único registro de painéis. O painel de
  cena é carregado por `import()`; o bundle inicial não contém three.js.
  `studio.catalog.ids` e `studio.bundle.initial` verificam.
- **AP-02**: `src/bridge/simulation.ts` guarda o estado de simulação fora do
  Svelte e drena o ring uma vez por frame. `studio.frame.coalesce` e
  `studio.frame.no-store-write` verificam.
- **Evento**: `PIN_CHANGE` com `code` = GPIO e bit 0 de `payload` = nível
  ([`docs/03-arquitetura.md`](../../docs/03-arquitetura.md) §5.3). O LED do board
  é o GPIO 8.
- **Board**: `public/models/c3-devkit-v1.gltf` é gerado por
  [`../../tools/gen/board-c3-devkit-v1.mjs`](../../tools/gen/board-c3-devkit-v1.mjs).
  Aproximação funcional das dimensões de um devkit C3, em mm, com origem no
  canto; sem logotipo, serigrafia, arte ou arquivo de terceiro. Proveniência em
  [`../../provenance/board-c3-devkit-v1.yaml`](../../provenance/board-c3-devkit-v1.yaml).
  `npm test` falha se o arquivo estiver desatualizado.

## Validação do spike

Execução local em 2026-10-27, com o build WASM do E0-05:

- `npm test`: 18 testes em 7 arquivos, todos passando (inclui o hash do board
  contra `provenance/board-c3-devkit-v1.yaml`).
- `npm run build`: chunk inicial de 33,8 kB; chunk da cena (three.js) de 632,8 kB
  (158,6 kB gzip), carregado sob demanda.
- No preview (`http://localhost:4173/`), `crossOriginIsolated: true`, o status
  mostra `Core 0.1.0 · ABI 0x1`, o canvas existe e o console fica sem mensagens.
- O botão de hook alterna `data-led` de `off` para `on` e de volta para `off`:
  o evento sai do core no Worker, passa pelo ring e chega ao material do LED.

## Limitações

- Board simplificado: sem pinout completo, fios, editor ou outros componentes.
- Um LED em um GPIO, via `esp32sim_test_emit`; o GPIO real chega no E1-02.
- Catálogos pt-BR/en prontos, sem troca de idioma em runtime.
- A cena é focável e tem controles de teclado; auditoria de acessibilidade
  automatizada fica no E1-06.
