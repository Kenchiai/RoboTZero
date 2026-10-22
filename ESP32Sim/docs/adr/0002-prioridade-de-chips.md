# ADR 0002 — Prioridade de chips

- **Status:** Proposto
- **Data:** 2026-10-22
- **Decisores:** lead, produto, engenharia

## Contexto

A família ESP32 inclui Xtensa LX6/LX7 e RISC-V, single/dual-core, com
periféricos e conectividade muito diferentes. Implementar todos ao mesmo tempo
é inviável. É preciso escolher a ordem que maximiza aprendizado e valor.

## Decisão proposta

Ordem de implementação:

1. **ESP32-C3** (RV32IMC, single-core) — MVP.
2. **ESP32-S3** (Xtensa LX7, dual-core, USB/PSRAM) — V1.
3. **ESP32-C6** (RISC-V + LP core, Wi-Fi 6/BLE/802.15.4) — V2.
4. **ESP32 clássico** (LX6, dual-core) — V2/V3.
5. **ESP32-H2** — V3.
6. **ESP32-P4** — V3+.

## Motivações

- C3 tem ISA menor, boa documentação e cobre o pipeline completo.
- C3 e C6 compartilham família RISC-V; o investimento se reutiliza.
- S3 é o chip mais usado da geração nova e valida Xtensa/dual-core/USB.
- O clássico é importante para compatibilidade, mas carrega legado.
- C6/H2/P4 são nichos que podem esperar.

## Consequências

### Positivas

- MVP mais rápido e testável.
- Base RISC-V reutilizável.
- Xtensa entra quando o SoC e a UI já estão estáveis.
- Permite lançar com um chip bem suportado em vez de vários superficiais.

### Negativas

- Projetos Wokwi baseados em ESP32 clássico não rodam no MVP.
- O S3 (Xtensa) atrasa a cobertura da maioria dos usuários.
- C6/H2/P4 ficam distantes.

## Mitigações

- Comunicar claramente a matriz de suporte.
- Permitir upload de firmware de chips não suportados com mensagem clara.
- Manter a arquitetura de CPU/SoC extensível.
- Reavaliar a ordem após o G1 com dados de demanda.

## Critérios de revisão

- Demanda de usuários por chip.
- Disponibilidade de documentação.
- Custo de hardware de teste.
- Complexidade de periféricos.
