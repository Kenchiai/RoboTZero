# Build

Fase 0: CMake + Ninja + C++23, com build nativo para testes e build WASM via
Emscripten. O alvo WASM é um módulo autônomo com ABI C versionada (E0-04); o
Worker e o ring buffer entram no E0-05 e o studio three.js no E0-06.

## Pré-requisitos

- CMake ≥ 3.28
- Ninja
- Clang ≥ 17 ou GCC ≥ 13 com C++23
- Emscripten (emsdk) para o alvo WASM

Ambiente validado em 2026-10-25:

| Ferramenta | Versão |
| --- | --- |
| Ubuntu (WSL2) | 26.04.1 LTS |
| CMake | 4.2.3 |
| Ninja | 1.13.2 |
| Clang | 21.1.8 |
| GCC | 15.2.0 |
| Emscripten | 6.0.13 |

## Instalação no WSL

```bash
sudo apt-get update
sudo apt-get install -y cmake ninja-build clang lld build-essential

git clone https://github.com/emscripten-core/emsdk.git /opt/emsdk
cd /opt/emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

## Build nativo e testes

```bash
cd ESP32Sim
cmake --preset native
cmake --build --preset native
ctest --preset native
```

O preset `native` usa `CMAKE_BUILD_TYPE=Debug`, `-Werror` e C++23.

## Build WASM

```bash
source /opt/emsdk/emsdk_env.sh
cd ESP32Sim
cmake --preset wasm
cmake --build --preset wasm
ctest --preset wasm          # smoke do módulo no Node
```

O preset `wasm` usa
`$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake` e compila
o core com `-fno-exceptions -fno-rtti -matomics -mbulk-memory`.

O módulo é gerado em `build/wasm/wasm/esp32sim.wasm` com `-sSTANDALONE_WASM`:
**zero imports**, sem glue JS e com os nomes de export iguais aos da ABI C.
Isso permite instanciar com `WebAssembly.instantiate(bytes, {})` e ler a memória
linear direto, sem chamada JS por ciclo.

Duas flags existem por causa disso:

- `-sSHARED_MEMORY=1` faz `memory.buffer` ser um `SharedArrayBuffer`, que o
  Worker publica para a main thread ler o ring com `Atomics`. O crescimento de
  memória fica desligado (`-sALLOW_MEMORY_GROWTH=0`): se o heap crescer, o
  buffer é trocado e as views do host apontam para memória morta.
- `-sMALLOC=emmalloc` porque o dlmalloc, com atomics, arrasta
  `clock_time_get` e `__do_set_thread_state` e o módulo deixa de ter zero
  imports. Revisitar se o perfil de alocação justificar dlmalloc.

Contrato de export (o que o loader pode usar):

- `esp32sim_*` — a ABI de `include/esp32sim/abi.h`;
- `malloc`, `free` — alocação para structs de saída;
- `memory` — memória linear;
- `_initialize` — chamar uma vez após instanciar, antes de qualquer `esp32sim_*`.

O restante (`setThrew`, `_emscripten_stack_restore`,
`emscripten_stack_get_current`, `__indirect_function_table`) é interno do
runtime e não faz parte do contrato.

O teste `wasm_smoke` roda `wasm/smoke.cjs`, que instancia o `.wasm` cru no Node
e chama a ABI. Ele imprime o tamanho do artefato; não há script separado de
inspeção.

## Worker e ring de eventos (E0-05)

O core roda em um Web Worker. O Worker instancia o `.wasm`, cria o ring e
publica uma vez `{ buffer, ringOffset, eventsOffset, capacity }`; a main thread
drena com `Atomics` e nunca chama JS por ciclo.

```text
wasm/worker/esp32sim.worker.mjs   # Worker: load, init, run, emit
wasm/worker/ring.mjs              # drain() e dropped() para a main thread
wasm/worker/worker.test.mjs       # teste do Worker real no Node
wasm/demo/e0-05.html              # prova no navegador (uma drenagem por frame)
wasm/dev-server.cjs               # servidor com COOP/COEP
```

`ctest --preset wasm` roda `wasm_smoke` e `worker_smoke`. Para ver no navegador:

```bash
node wasm/dev-server.cjs        # depois abra http://localhost:8080/
```

`SharedArrayBuffer` exige cross-origin isolation, então o dev server manda
`COOP: same-origin` e `COEP: require-corp` — os mesmos headers do deploy (E0-07).
Sem eles a página mostra `crossOriginIsolated: false` e para.

## Studio (E0-06)

O studio fica em `apps/studio/` (Svelte 5 + Vite + TypeScript). three.js só
entra no chunk do painel de cena, carregado sob demanda (AP-01 do ADR 0007). O
spike carrega o board glTF e acende o LED quando o core publica `PIN_CHANGE`.

### Pré-requisitos

- Node 22.x ≥ 22.19, 24.x ≥ 24.11 ou 26+ (E0-01) e `npm`.
- Build WASM do core feito: `npm run dev` copia `esp32sim.wasm` e o Worker para
  `apps/studio/public/core/`. Sem o `.wasm`, o build passa e a página mostra o
  erro ao carregar o core.

### Comandos

```bash
cd ESP32Sim/apps/studio
npm ci
npm run dev        # http://localhost:5173/
npm test           # catálogo, bundle inicial, frame, board glTF, i18n e tokens
npm run check      # tsc --noEmit
npm run build
npm run preview    # http://localhost:4173/
```

`dev` e `preview` mandam `COOP: same-origin` e `COEP: require-corp`; sem
`SharedArrayBuffer` não há ring.

### Board e LED

- `tools/gen/board-c3-devkit-v1.mjs` gera
  `apps/studio/public/models/c3-devkit-v1.gltf`: aproximação funcional das
  dimensões de um devkit C3, em milímetros, com origem no canto da placa, sem
  logotipo ou arte de terceiro. Proveniência:
  [`provenance/board-c3-devkit-v1.yaml`](provenance/board-c3-devkit-v1.yaml).
- Metadados: `scenes[0].extras` (`boardId`, `unit`, `dimensions`) e o nó
  `LED_USER` com `extras.gpio = 8`.
- Contrato do evento (`docs/03-arquitetura.md` §5.3): em `PIN_CHANGE`, `code` é o
  GPIO e o bit 0 de `payload` é o nível. `SimulationBridge.pump()` drena o ring
  uma vez por frame; a UI não reage a evento de pino.
- Até o GPIO do core existir (E1-02), o botão do studio usa
  `esp32sim_test_emit` como hook de teste.

O `.gltf` é versionado; `npm test` roda o gerador com `--check` e falha se o
arquivo estiver desatualizado (`npm run models` regrava).

### Limitações do spike

- Board simplificado (não é réplica), sem pinout completo, fios ou editor.
- Um LED em um GPIO; sem outros componentes.
- Catálogos pt-BR/en prontos, sem troca de idioma em runtime.
- A cena é focável e tem controles de teclado; auditoria de acessibilidade
  automatizada fica no E1-06.

## ABI C (v0.1)

Header: `include/esp32sim/abi.h` (C11 válido, auto-contido). O build nativo
compila `tests/abi_c11.c` como C11, então a promessa é verificada.

| Função | Contrato |
| --- | --- |
| `esp32sim_abi_version()` | Versão empacotada: major nos 16 bits altos, minor nos baixos |
| `esp32sim_get_version(out)` | Preenche `esp32sim_version`; `out` nulo é erro |
| `esp32sim_version_string()` | Ponteiro para string estática na memória linear |
| `esp32sim_create(config, out)` | `config` nulo usa defaults; handle opaco em `out` |
| `esp32sim_destroy(handle)` | Aceita nulo |
| `esp32sim_run(handle, cycles)` | Avança `cycles`; overflow devolve erro sem mudar estado |
| `esp32sim_cycle_count(handle)` | Devolve 0 para handle nulo |
| `esp32sim_event_ring_init(handle, cap)` | Cria o ring; `cap` potência de 2 ≥ 2; segunda chamada devolve `ESP32SIM_ERROR_STATE` |
| `esp32sim_event_ring_header(handle)` | Ponteiro para o header de 16 bytes, ou nulo |
| `esp32sim_event_ring_events(handle)` | Ponteiro para o array de eventos, ou nulo |
| `esp32sim_test_emit(handle, ...)` | Hook de teste até GPIO/UART gerarem eventos (E1-02) |

Ring: SPSC, produtor é o core e consumidor é o host. `head`/`tail` são
contadores livres de 32 bits e o slot é `contador & (capacidade - 1)`; toda
leitura e escrita dos contadores é atômica (`std::atomic_ref` no C++, `Atomics`
no JS). Ring cheio descarta o evento mais novo e incrementa `dropped`.

Regras de evolução:

- `esp32sim_config` só cresce por acréscimo de campos ao final.
- `struct_size` menor que o conhecido, ou `flags != 0`, é rejeitado.
- `esp32sim_version` é **congelado** em 16 bytes; identidade nova vai em função
  nova. O `static_assert` em `core/src/abi.cpp` quebra o build se o layout mudar.
- Códigos de erro são estáveis; strings ficam fora do hot path.
- Nenhuma exceção cruza a fronteira: erros são códigos de retorno.

## Estrutura criada

```text
ESP32Sim/
  CMakeLists.txt
  CMakePresets.json
  cmake/CompilerWarnings.cmake
  core/                 # biblioteca estática do core
  include/esp32sim/     # abi.h + version.hpp gerado
  wasm/                 # módulo WASM, Worker, demo e dev server
  tests/                # testes nativos
```

`build/` é ignorado pelo git.

## Limitação conhecida

CMake 4.2.3 emite aviso de que não suporta *shared libraries* do Emscripten.
Isso não afeta bibliotecas estáticas nem executáveis WASM. Se o projeto passar a
precisar de shared libraries, usar CMake < 4.2.0 ou > 4.3.3.

## Determinismo

- O core não usa `std::chrono`, `time()`, `rand()` global nem ordem de
  `unordered_map`.
- Exceções e RTTI ficam desabilitadas no build WASM.
- Todo comportamento novo precisa de teste nativo e, quando aplicável, trace
  dourado.
