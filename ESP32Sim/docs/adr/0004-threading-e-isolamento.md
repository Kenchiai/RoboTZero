# ADR 0004 — Threading e isolamento

- **Status:** Proposto
- **Data:** 2026-10-22
- **Decisores:** lead, WASM, core

## Contexto

O core roda em Web Worker. O navegador oferece `SharedArrayBuffer` e threads
WASM, mas threads introduzem não determinismo, complexidade de build e
requisitos de cross-origin isolation (COOP/COEP). O ESP32 pode ter dois núcleos,
mas isso não exige paralelismo real no host.

## Decisão proposta

### MVP

- **Um Web Worker, core single-thread.**
- Simulação dual-core (quando chegar) é **intercalada deterministicamente** no
  mesmo thread.
- `SharedArrayBuffer` apenas para snapshots/ring buffers entre worker e main.
- `postMessage` para comandos e eventos de controle.
- Build sem pthreads por padrão; build threaded opcional para experimentos.

### Evolução

- Threads só para tarefas fora do core: decode de assets, compilação,
  análise.
- Se threads no core forem necessárias:
  - lockstep com barreiras por ciclo;
  - ordem total de eventos;
  - testes de determinismo em CI;
  - ADR específico aprovado.

## Motivações

- Determinismo é requisito de produto e de conformidade.
- O ganho de threads no core é incerto e o custo de debugging é alto.
- O MVP não precisa de paralelismo para rodar C3.
- COOP/COEP pode quebrar embed/integrações; fallback é importante.

## Consequências

### Positivas

- Traces reproduzíveis.
- Build e debug mais simples.
- Funciona em browsers sem `SharedArrayBuffer` (modo compatibilidade).
- Menos classes de bugs.

### Negativas

- Dual-core simulado pode ser mais lento que paralelo real.
- Threads para render/decoder ficam limitadas.
- Necessidade de otimizar o interpretador para atingir tempo real.

## Regras

- Nenhum acesso a estado compartilhado sem `Atomics` ou barreira.
- Nenhum `std::thread` no core sem contrato de sincronização.
- O modo single-thread é o padrão de CI.
- O modo threaded deve produzir o mesmo trace do single-thread.

## Critérios de revisão

- Desempenho single-thread < 50% do tempo real após otimização.
- Necessidade de emular SMP com fidelidade de ordem.
- Suporte de browsers a SAB/COOP/COEP estabilizado.
