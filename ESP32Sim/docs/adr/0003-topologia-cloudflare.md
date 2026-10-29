# ADR 0003 — Topologia Cloudflare e serviço de compilação

- **Status:** Proposto
- **Data:** 2026-10-22
- **Decisores:** lead, plataforma

> **Nota (E0-07):** a infraestrutura de Pages foi implementada (headers
> COOP/COEP/CSP, `wrangler.jsonc`, smoke e workflow de deploy) e validada em
> `wrangler pages dev`; o aceite depende do deploy público, que aguarda
> `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`.

## Contexto

O produto precisa hospedar o studio, APIs de projetos, assets e compilação de
firmware. A simulação roda no cliente (WASM), mas a compilação Arduino/ESP-IDF
exige toolchain nativa e não cabe em um Worker.

## Decisão proposta

- **Pages** para o studio estático e WASM.
- **Workers** para API, auth, quotas, shares e orquestração.
- **R2** para assets, projetos, firmwares e artefatos.
- **D1** para metadados transacionais.
- **KV** para cache e flags.
- **Durable Objects** apenas para colaboração/sessões (Fase 4).
- **Queues** para jobs de compilação.
- **Compilação:**
  - MVP: upload de `.bin`/`.elf` + compilação local documentada.
  - Beta: Cloudflare Containers com `arduino-cli` e ESP-IDF.
  - Contingência: runner externo com callback assinado.

## Motivações

- Custo de CPU de simulação zero para o provedor.
- Baixa latência e cache de borda.
- Separação clara entre dados, assets e builds.
- Caminho incremental: não bloquear o MVP em Containers.

## Consequências

### Positivas

- Deploy simples e barato no início.
- Escala de leitura via Pages/R2.
- Compilação isolada e substituível.
- Export/portabilidade de dados.

### Negativas

- Múltiplos produtos e limites para operar.
- Compilação tem cold start e custo.
- COOP/COEP exige configuração correta.
- D1 não serve para blobs; R2 não é banco.
- Vendor lock-in mitigado por camada de abstração e export.

## Regras

- Nenhum segredo no cliente.
- Nenhum firmware executado no servidor.
- Builds com timeout, quota e artefatos expiráveis.
- Headers de isolamento e CSP testados em CI.
- Migrações D1 compatíveis para trás.

## Critérios de revisão

- Containers indisponíveis ou caros demais.
- Latência de build > 60 s p95.
- Custo por build acima do orçamento.
- Necessidade de colaboração em tempo real.
