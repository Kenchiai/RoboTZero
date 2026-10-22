# 00 — Visão geral

## 1. Problema

Simuladores de ESP32 disponíveis hoje caem em três grupos:

1. **Web proprietários** (ex.: Wokwi), com boa experiência, mas sem controle
   sobre o core, o formato de projeto ou a extensibilidade.
2. **Emuladores de desktop** (ex.: QEMU, Renode, simuladores de fabricante),
   precisos em alguns pontos, mas com UX e deployment inadequados para
   educação, prototipagem rápida e compartilhamento.
3. **Simuladores simplificados**, que interpretam um subconjunto de Arduino e
   não executam firmware real.

O ESP32Sim aponta para um quarto caminho: **core próprio em C++23, execução de
firmware real, interface web 3D e deployment na Cloudflare**.

## 2. Público

- Estudantes e makers que querem testar firmware sem hardware.
- Engenheiros que precisam de testes determinísticos e reproduzíveis.
- Educadores que precisam compartilhar cenários por URL.
- Desenvolvedores de bibliotecas que querem validar exemplos em CI.

## 3. Proposta de valor

| Diferencial | Como será entregue |
| --- | --- |
| Desempenho | Core C++23 compilado para WASM, com SIMD, threads e orçamento de ciclos |
| Fidelidade | CPU + SoC + periféricos reais, não um interpretador de Arduino |
| Determinismo | Scheduler de ciclos, RNG com seed, traces reproduzíveis |
| Interface 3D | Three.js como camada de apresentação, com placas e componentes em glTF |
| Extensibilidade | ABI C versionada, modelos de dispositivo e definições de placa declarativas |
| Verificação | Traces dourados, testes diferenciais e CI desde a Fase 1 |
| Deployment | WASM estático em Cloudflare Pages/Workers; compilação em serviço separado |

## 4. Princípios de engenharia

### 4.1 Core C++23, interface fina

- O core não inclui headers de DOM, three.js, JSON ou HTTP.
- O core recebe comandos por ABI C e devolve eventos agregados.
- O frontend não calcula tempo de simulação, nem estados de pino.
- O mesmo core roda nativamente (testes/CI) e em WASM (navegador).

### 4.2 Determinismo

- Nenhum uso de `std::chrono`, `time()`, `rand()` global ou ordem de
  `unordered_map` no caminho de simulação.
- RNG explícito, com seed no estado do projeto.
- Ordem de eventos definida por `(cycle, priority, sequence)`.
- Threads só com sincronização explícita e modelo documentado.

### 4.3 Evidência antes de código

Toda implementação de comportamento precisa de uma das seguintes fontes:

- datasheet/TRM público da Espressif;
- documento de arquitetura ou código-open-source compatível;
- firmware de teste e trace de referência;
- observação de comportamento permitida pelos termos aplicáveis.

Quando a fonte não existir, o comportamento fica marcado como `unknown` e não
é inventado.

### 4.4 Clean-room

- A equipe de evidência observa e escreve especificações.
- A equipe de implementação escreve código a partir da especificação e de
  fontes públicas.
- Nenhum código, asset, CSS, modelo 3D ou dado proprietário é copiado.
- Ver [`08-riscos-e-licencas.md`](08-riscos-e-licencas.md).

## 5. Escopo resumido

| Fase | Entrega |
| --- | --- |
| 0 | Decisões, avaliação do REA, licenças, spikes de C++23/WASM/three.js/Cloudflare |
| 1 | ESP32-C3 + firmware Arduino + GPIO/UART/timer + board 3D + deploy |
| 2 | ESP32-S3 + I2C/SPI/ADC/PWM/RMT/DMA + GDB + analisador lógico |
| 3 | Wi-Fi/BLE/802.15.4 + dual-core + FreeRTOS SMP + ESP32-C6 |
| 4 | ESP32 clássico, P4, colaboração, custom chips e marketplace |

## 6. Métricas de sucesso

### Técnicas

- **Desempenho:** ≥ 50% do tempo real em um notebook médio no MVP; ≥ 100% no
  V1 para firmware de teste, com margem para picos.
- **Latência de UI:** 60 fps para a cena 3D; 30 fps mínimo em placas grandes.
- **Determinismo:** 100% dos traces dourados idênticos entre execuções e entre
  builds nativo/WASM.
- **Cobertura de ISA:** 100% das instruções documentadas dos núcleos suportados
  cobertas por testes.
- **Confiabilidade:** nenhuma regressão de conformidade em `main` por mais de
  um dia.

### Produto

- Tempo até o primeiro blink: < 60 s a partir de um projeto novo.
- Tempo de carregamento do studio: < 3 s em conexão média.
- Compartilhamento de projeto por URL sem perda de fidelidade.
- Taxa de sucesso de exemplos oficiais Arduino/ESP-IDF: 100% no escopo.

## 7. Não objetivos (MVP)

- Substituir o hardware real em certificação ou validação elétrica.
- Simular analogicamente o mundo físico em SPICE.
- Emular todos os periféricos de todos os chips no primeiro release.
- Ser compatível byte a byte com o formato de projeto do Wokwi; a meta é
  interoperabilidade documentada, não clone.
- Rodar firmware proprietário sem licença.

## 8. Documentos

- [`01-avaliacao-rea.md`](01-avaliacao-rea.md)
- [`02-escopo-requisitos.md`](02-escopo-requisitos.md)
- [`03-arquitetura.md`](03-arquitetura.md)
- [`04-plano-de-trabalho.md`](04-plano-de-trabalho.md)
- [`05-agentes.md`](05-agentes.md)
- [`06-conformidade-verificacao.md`](06-conformidade-verificacao.md)
- [`07-plataforma-cloudflare.md`](07-plataforma-cloudflare.md)
- [`08-riscos-e-licencas.md`](08-riscos-e-licencas.md)

## 9. Glossário

| Termo | Significado |
| --- | --- |
| **Core** | Aplicação C++23 que contém CPU, SoC, periféricos, scheduler e devices |
| **Studio** | Aplicação web TypeScript + three.js que apresenta e controla o core |
| **Board** | Definição de uma placa (chip, pinos, periféricos, modelo 3D) |
| **Part** | Componente virtual (LED, botão, sensor, display) |
| **Trace** | Registro ordenado de eventos de execução para verificação |
| **Golden trace** | Trace de referência usado como teste de conformidade |
| **TRM** | Technical Reference Manual da Espressif |
| **ABI** | Interface binária estável entre core e frontend |
