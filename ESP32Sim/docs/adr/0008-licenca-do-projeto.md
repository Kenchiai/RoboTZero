# ADR 0008 — Licença do projeto

- **Status:** Aceito
- **Data:** 2026-10-29
- **Decisores:** lead, clean-room
- **Relaciona-se com:** [`08-riscos-e-licencas.md`](../08-riscos-e-licencas.md) §3
  e §8, [`04-plano-de-trabalho.md`](../04-plano-de-trabalho.md) E0-02/E0-07,
  [`provenance/`](../../provenance/), [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md)

## 1. Contexto

O gate G0 exige "nenhuma licença bloqueante", e o E0-07 publica o studio na
Cloudflare Pages — ato de distribuição. Até aqui o projeto tinha uma
contradição registrada: o `LICENSE` da raiz do repositório é CC0 1.0, mas o
`README.md` do ESP32Sim dizia que a licença "ainda não foi decidida" e pedia
para não distribuir binários ou assets.

`08-riscos-e-licencas.md` §3 já comparava três estratégias e terminava com
"Decisão: pendente. Registrar em ADR antes do primeiro release público". Este
ADR fecha a pendência.

Restrições consideradas:

- O repositório tem vários projetos com autores e licenças próprias
  (`LineFollower/RobotZero-Nano-2024` é MIT de outro autor; a raiz é CC0).
  Alterar o `LICENSE` da raiz relicenciaria código de terceiros.
- O produto depende de bibliotecas permissivas (three.js e Svelte, MIT) e o
  bundle distribuído as embute minificadas.
- A Fase 3 inclui Wi-Fi/BLE, onde patentes pesam (R-20), mas o MVP não.

## 2. Decisão

1. O **código do ESP32Sim** — core C++23, ABI C, Worker, studio (TypeScript,
   Svelte, three.js) e scripts de build — é licenciado sob **MIT**, em
   [`ESP32Sim/LICENSE`](../../LICENSE).
2. **Documentação, evidências e assets gerados** (por exemplo o glTF do board
   em `apps/studio/public/board/`) permanecem sob o **CC0 1.0** do `LICENSE` da
   raiz. O manifesto de proveniência de cada asset declara `license` explícita.
3. **Dependências de terceiros** mantêm as próprias licenças e são registradas
   em [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md). O artefato
   publicado precisa conter os avisos exigidos por elas.
4. **GPL/AGPL** continua restrita a ferramentas não distribuídas (CI, oráculo,
   scripts locais), conforme a Opção A de `08-riscos-e-licencas.md` §3.
5. O escopo é o diretório `ESP32Sim/`. `AuralFocus`, `LineFollower` e
   `LineFollower_Simulator` não são afetados.

Contribuições são aceitas sob a mesma licença do arquivo alterado
(inbound = outbound), sem CLA.

## 3. Consequências

**Positivas**

- Desbloqueia o E0-07 e o gate G0: há uma licença explícita para o que será
  publicado.
- MIT é compatível com as dependências (todas permissivas), com uso comercial e
  com a futura separação entre core aberto e serviços (Opção C), se ela vier.
- O escopo por diretório preserva as licenças dos outros projetos.

**Negativas e obrigações**

- MIT não concede patentes de forma explícita. Se a Fase 3 (Wi-Fi/BLE) trouxer
  exposição relevante, a revisão de R-20 precisa acontecer antes do release
  daquela fase; uma mudança para Apache-2.0 depois exigiria acordo dos
  contribuintes.
- Os commits até `ba9f0e2` foram publicados sob o CC0 da raiz. Essa outorga não
  é revogável para cópias já distribuídas: o MIT vale do ADR em diante, não
  retroativamente. Como as duas licenças são permissivas, o risco prático é
  baixo; o escopo está declarado no `README.md` da raiz e no do ESP32Sim.
- MIT exige incluir o aviso de copyright "em todas as cópias ou partes
  substanciais". O bundle publicado é uma cópia: o deploy tem de embarcar o
  texto da licença do projeto e os avisos das dependências.
- O `LICENSE` da raiz (CC0) e o do projeto (MIT) coexistem; qualquer arquivo
  novo precisa saber a qual escopo pertence. Os manifestos de proveniência
  passam a ser a fonte para assets.

## 4. Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Apache-2.0 | Melhor para patentes e marcas, mas adiciona obrigações de `NOTICE` e é mais burocrática para um MVP; pode ser reavaliada se a Fase 3 exigir |
| GPLv3 / AGPLv3 | Reduz adoção e complica um serviço pago futuro (Opção C); incompatível com parte do ecossistema de ferramentas |
| CC0 para o código | Sem concessão de patente, sem reconhecimento da OSI e sem texto de garantia pensado para software; fica reservada a docs e assets |
| Manter "pendente" | Bloqueia o E0-07 e o G0; "sem licença = sem permissão" (docs/08 §2) |
