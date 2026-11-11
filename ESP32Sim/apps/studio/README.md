# Studio (E0-06)

Prova de ponta a ponta da camada de apresentação: o core roda no Worker, o
studio drena o ring uma vez por frame e o LED da placa reage ao evento.

```text
checkbox → postMessage → Worker → esp32sim_test_emit → ring (SAB)
   → drain 1x/frame → pins (AP-03) → material do LED (three.js)
```

## Rodar

O `.wasm` precisa existir antes (o studio importa o artefato do build):

```bash
cd ESP32Sim
cmake --preset wasm && cmake --build --preset wasm

cd apps/studio
npm install
npm run dev        # http://localhost:5173
```

`npm test` roda as verificações de `node --test` (pinos, catálogo i18n, tokens
de tema, glTF do board, HUD, headers, licenças, proveniência e grafo do
bundle inicial); `npm run check` roda o `svelte-check`; `npm run build` gera
`dist/` depois de conferir que os assets gerados estão atualizados.

`npm test` também precisa do `.wasm`: o teste de grafo roda um build de
verdade (com `write: false`) para ler o grafo do bundler.

`npm run board` e `npm run notices` regeram o glTF e o arquivo de licenças. O
`prebuild` roda os dois com `--check` e falha se o arquivo versionado divergir
do gerador.

`SharedArrayBuffer` exige cross-origin isolation: o `vite.config.ts` já manda
`COOP: same-origin` e `COEP: require-corp` no dev e no preview.

## Verificações dos padrões do ADR 0007

| Teste | Padrão | O que falha |
| --- | --- | --- |
| `src/presentation/pins.test.ts` | AP-02/AP-03 | agregação de `PIN_CHANGE` por frame; módulo puro sem DOM |
| `src/i18n.test.ts` | AP-05 | chave usada sem entrada no catálogo; chave órfã |
| `src/render/tokens.test.ts` | AP-07 | cor literal fora de `tokens.css`; `read()` de token inexistente |
| `tools/board.test.ts` | AP-07 | glTF versionado divergindo do gerador; asset com cor fixa |
| `tools/hud.test.ts` | AP-02/AP-06 | `aria-live` no HUD de contadores; região viva duplicada |
| `tools/initial-graph.test.ts` | AP-01 | three.js alcançável por import estático a partir da entrada; three.js sumindo do build (teste vazio); cena deixando de ser import dinâmico |
| `src/bridge/isolation.test.ts` | E0-07 | predicado de COOP/COEP deixando passar ambiente sem `SharedArrayBuffer` |

Cada um foi validado por mutação: quebrar a regra de propósito faz o teste
falhar com mensagem acionável.

## Contrato usado

- `PIN_CHANGE`: `code` = GPIO, `payload` = nível (0 baixo, != 0 alto). É a
  convenção deste spike; o GPIO real entra em E1-02 e a convenção vai para
  `docs/03 §5.3`.
- O estímulo usa `esp32sim_test_emit`, o hook de teste da ABI, porque ainda não
  existe `esp32sim_set_pin`. A UI não calcula timing nem estado de pino.
- `LED_PIN = 8` é o LED do ESP32-C3-DevKitM-1; o mapa de pinos do diagrama
  (UN-009) continua desconhecido e é resolvido em E1-06.

## Limitações deste spike

- A placa é uma caixa paramétrica (`tools/gen-board.mjs`), não o modelo real;
  `provenance/board-esp32-c3-devkitm-1.yaml` registra isso.
- Sem catálogo de painéis (AP-01 completo), sem editor de fios, sem monitor
  serial: E1-06. O teste de grafo cobre a regra do AP-01 (bundle inicial sem
  three.js), não o mecanismo de catálogo por ID.
- AP-06 (acessibilidade) não tem auditoria automática nem teste de teclado; o
  `svelte-check` pega só violações estáticas de markup.
- AP-05 cobre chaves do catálogo; não cobre texto visível inline (exige lint) e
  não valida placeholders (`{x}`) por chamada.
- O `run(500)` por frame é um passo fixo para a cena andar; o agendamento real
  é do scheduler do core (E1-04).
- O HUD escreve no DOM direto do loop, uma vez por frame e só quando muda
  (AP-02); não usa store reativa por evento.
