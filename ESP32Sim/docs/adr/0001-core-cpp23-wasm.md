# ADR 0001 — Core em C++23 compilado para WebAssembly

- **Status:** Aceito
- **Data:** 2026-10-22
- **Decisores:** lead, engenharia de simulação

## Contexto

O simulador precisa executar CPU, SoC, periféricos e devices com desempenho
próximo ao tempo real, rodar no navegador e ser hospedado na Cloudflare. A
interface será three.js/TypeScript. Havia três caminhos principais:

1. emulador em TypeScript;
2. emulador em Rust compilado para WASM;
3. emulador em C++23 compilado para WASM.

Também foi considerada a execução de QEMU no servidor.

## Decisão

O simulador é um **aplicativo C++23**:

- CPU, SoC, periféricos, scheduler, devices, conectividade e tracing em C++23.
- Build WebAssembly via Emscripten, executado em Web Worker.
- Build nativo (MSVC/Clang/GCC) para testes, CI e ferramentas.
- Three.js/TypeScript apenas como camada de apresentação.
- ABI C estável, buffers compartilhados e eventos agregados.

## Motivações

- Desempenho e controle de memória previsíveis.
- Reuso do mesmo código em nativo e WASM.
- Ecossistema maduro de ferramentas C++ (CMake, sanitizers, fuzzing, GDB).
- Facilidade de integração com QEMU/oráculos e bibliotecas de firmware.
- Experiência prévia do time com C++/Emscripten no repositório.

## Consequências

### Positivas

- Hot path sem GC e com alocações controladas.
- Testes nativos rápidos e traces comparáveis.
- Portabilidade para desktop/CLI no futuro.
- Controle fino sobre timing e layout de memória.

### Negativas

- Toolchain mais complexa (Emscripten, CMake, cross-build).
- C++23 tem suporte parcial em algumas versões de compilador; features devem
  ser verificadas no CI.
- Sem exceções/RTTI no WASM exige disciplina com `std::expected`.
- Debug de WASM é mais trabalhoso que TS.
- Curva de aprendizado para contribuidores de frontend.

## Alternativas rejeitadas

| Alternativa | Motivo |
| --- | --- |
| TypeScript | Desempenho e controle de memória insuficientes para 240 MHz |
| Rust/WASM | Boa opção, mas o time e o repositório já usam C++; integração C++ com QEMU/IDF é mais direta |
| QEMU no servidor | Custo, latência, GPL, dependência de rede e falta de controle do core |
| QEMU em WASM | Tamanho/complexidade e obrigações GPL; pode ser usado como oráculo, não como produto |

## Regras derivadas

- O core não inclui headers de UI, JSON, HTTP ou DOM.
- Exceções/RTTI desabilitadas no WASM, salvo novo ADR.
- `std::expected` para erros; sem `throw` no core.
- Todo comportamento tem teste nativo + WASM.
- O build WASM é reproduzível e pinado.

## Critérios de revisão

Reavaliar este ADR se:

- o desempenho ficar abaixo de 50% do tempo real após otimização;
- o tamanho do WASM inviabilizar o carregamento;
- o suporte a C++23 no Emscripten bloquear features essenciais;
- houver necessidade de JIT/dynamic code generation.
