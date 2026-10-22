# RoboTZero — instruções para agentes

## Contexto do repositório

Este repositório contém vários projetos de robótica e simulação. O projeto ativo
para este fluxo de trabalho é o **ESP32Sim**, em `ESP32Sim/`.

Leia, nesta ordem:

1. `ESP32Sim/docs/00-visao-geral.md` — visão, escopo e princípios.
2. `ESP32Sim/docs/03-arquitetura.md` — arquitetura técnica.
3. `ESP32Sim/docs/05-agentes.md` — papéis, handoffs e protocolo de trabalho.

Para decisões de interoperabilidade com o Wokwi, leia também
`ESP32Sim/docs/01-avaliacao-rea.md`. Para licenças e clean-room, leia
`ESP32Sim/docs/08-riscos-e-licencas.md`.

## Decisão técnica vinculante

- O simulador (CPU, SoC, periféricos, dispositivos virtuais, scheduler,
  conectividade e tracing) é um **aplicativo C++23**.
- O core é compilado para **WebAssembly (Emscripten)** e executado em um
  **Web Worker**. O mesmo código é compilado nativamente para testes, CI e
  ferramentas de verificação.
- **Three.js e TypeScript são apenas a camada de apresentação e interação.**
  Nenhuma lógica de emulação, timing ou estado de periférico deve viver no
  frontend.
- O core deve ser determinístico: não use relógio de parede, `rand()` global,
  ordem de iteração não determinística ou threads sem sincronização explícita.
- O hot path não pode depender de JSON, alocações dinâmicas por instrução ou
  chamadas JS por ciclo. Use ABI C estável, buffers compartilhados e eventos
  agregados.

## Regras de engenharia

- C++23, CMake e Emscripten. Evite dependências pesadas; justifique cada uma.
- Prefira `std::expected`, `std::span`, `std::bit_cast`, `std::byteswap`,
  `std::to_underlying` e `if consteval` quando simplificarem o código.
- Exceções e RTTI ficam desabilitadas no build WASM (`-fno-exceptions`,
  `-fno-rtti`) salvo decisão explícita em ADR.
- Todo periférico novo precisa de teste de unidade, teste de integração e
  evidência de comportamento (datasheet/TRM ou trace de referência).
- Toda decisão arquitetural relevante vira um ADR em `ESP32Sim/docs/adr/`.
- Toda mudança de comportamento deve atualizar o teste de conformidade ou
  explicar por que ele não se aplica.
- Não introduza segredos, chaves, firmware proprietário ou assets sem licença
  no repositório.
- Não altere os outros projetos do repositório (`AuralFocus`, `LineFollower`,
  `LineFollower_Simulator`, `Docs`) sem pedido explícito.

## Clean-room e propriedade intelectual

- O objetivo é interoperabilidade e engenharia reversa **lícita**.
- Não copie código, HTML/CSS, modelos 3D, imagens, fontes, dados ou assets
  proprietários do Wokwi ou de qualquer outro produto.
- Separe a equipe de evidência (observação e especificação) da equipe de
  implementação. A especificação descreve comportamento; o código é escrito a
  partir dela e de fontes públicas.
- Respeite os termos de uso, EULA, licenças e marcas. Em caso de dúvida,
  registre a dúvida e bloqueie a implementação até revisão.
- QEMU, lcgamboa, Velxio, Arduino, ESP-IDF e outras referências têm licenças
  próprias. Verifique obrigações antes de distribuir qualquer binário.

## Estilo e validação

- C++: nomes em inglês, `snake_case` para funções/variáveis, `PascalCase` para
  tipos, headers auto-contidos, sem `using namespace` em headers.
- TypeScript: modo `strict`, sem `any` não justificado, three.js isolado na
  camada de renderização.
- Documentação: português (pt-BR); identificadores e APIs em inglês.
- Antes de concluir uma tarefa, rode o build e os testes relevantes. Se não
  houver comando definido, proponha o comando e registre em `AGENTS.md`.
- Commits: Conventional Commits, escopo `esp32sim` quando aplicável. Nunca
  faça commit sem pedido explícito.

## Agentes

O agente principal é `esp32-lead`. Use os subagentes especializados descritos
em `ESP32Sim/docs/05-agentes.md`. O lead deve delegar trabalho independente e
exigir evidência antes de aceitar conclusões.
