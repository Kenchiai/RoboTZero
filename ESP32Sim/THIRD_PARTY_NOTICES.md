# Third-party notices

Este arquivo registra licenças e obrigações de materiais de terceiros usados no
ESP32Sim. Ele complementa — e não substitui — a revisão de
[`docs/08-riscos-e-licencas.md`](docs/08-riscos-e-licencas.md).

O artefato publicado (o studio no Cloudflare Pages) embute parte deste material.
O que chega ao usuário está na seção 1; as seções 2 e 3 registram o que não é
distribuído. Os textos completos das licenças da seção 1 são embarcados em
`dist/THIRD_PARTY_LICENSES.txt`, gerado por
[`apps/studio/tools/gen-notices.mjs`](apps/studio/tools/gen-notices.mjs).

## 1. Embarcado no artefato publicado

| Item | Versão | Licença | Onde entra |
| --- | --- | --- | --- |
| ESP32Sim | — | MIT | Código do core, Worker e studio |
| three.js | 0.186.1 | MIT | `scene-*.js` (render 3D) |
| Svelte | 5.57.3 | MIT | `index-*.js` (runtime da UI) |
| Emscripten (runtime e emmalloc) | 6.0.13 | MIT ou UIUC/NCSA | Dentro de `esp32sim.wasm` |

### 1.1 ESP32Sim

Copyright (c) 2026 ESP32Sim contributors. Texto completo em
[`LICENSE`](LICENSE). A decisão está no
[ADR 0008](docs/adr/0008-licenca-do-projeto.md).

### 1.2 three.js

`Copyright © 2010-2026 three.js authors` — licença MIT. Texto completo em
`node_modules/three/LICENSE` e em `dist/THIRD_PARTY_LICENSES.txt`.

### 1.3 Svelte

`Copyright (c) 2016-2025 Svelte Contributors` — licença MIT. Texto completo em
`node_modules/svelte/LICENSE.md` e em `dist/THIRD_PARTY_LICENSES.txt`.

### 1.4 Emscripten

O `.wasm` é `-sSTANDALONE_WASM` e usa o runtime e o `emmalloc` do Emscripten.
O projeto oferece MIT ou University of Illinois/NCSA; o texto MIT é o embarcado
em `dist/THIRD_PARTY_LICENSES.txt`.

## 2. Somente build/CI (não distribuído)

Ferramentas usadas para gerar o artefato. Nenhuma delas é redistribuída, então
as obrigações de aviso não alcançam o `dist`.

| Item | Versão | Licença |
| --- | --- | --- |
| Vite | 8.3.5 | MIT |
| TypeScript | 5.9.3 | Apache-2.0 |
| @sveltejs/vite-plugin-svelte | 7.3.1 | MIT |
| svelte-check | 4.7.7 | MIT |
| Node.js | 24 LTS | MIT |
| CMake | — | BSD-3-Clause |
| Ninja | — | Apache-2.0 |
| GitHub Actions | — | termos do GitHub |

## 3. Somente documentação/evidência (não distribuído)

### 3.1 `wokwi/wokwi-docs`

| Item | Valor |
| --- | --- |
| Origem | `https://github.com/wokwi/wokwi-docs` |
| Commit usado | `5c90e532d24fb8ac4cd471e9568db03917011e91` |
| Uso | Inventário documental de funcionalidades em [`evidence/2026-10-25/wokwi-feature-inventory/`](evidence/2026-10-25/wokwi-feature-inventory/README.md) |
| Material usado | Texto da documentação (consulta, paráfrase e notas técnicas curtas). Nenhum código, asset, imagem ou modelo |
| Licença | MIT |
| Copyright | Copyright (c) 2021-2024 CodeMagic LTD |
| Cópia da licença | [`evidence/2026-10-25/wokwi-feature-inventory/artifacts/LICENSE-wokwi-docs.txt`](evidence/2026-10-25/wokwi-feature-inventory/artifacts/LICENSE-wokwi-docs.txt) |

Texto da licença:

```text
The MIT License (MIT)

Copyright (c) 2021-2024 CodeMagic LTD

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### 3.2 `DietrichGebert/ponytail`

| Item | Valor |
| --- | --- |
| Origem | `https://github.com/DietrichGebert/ponytail` |
| Uso | Skill de método de desenvolvimento em [`.opencode/skills/ponytail/`](../.opencode/skills/ponytail/SKILL.md) |
| Material usado | Texto das instruções da skill |
| Licença | MIT |
| Copyright | Copyright (c) 2026 DietrichGebert |
| Cópia da licença | [`.opencode/skills/ponytail/LICENSE`](../.opencode/skills/ponytail/LICENSE) |

A skill orienta o processo (menor mudança que resolve, teste junto, sem
abstração especulativa). Não contém código, asset ou dado do produto e não é
embarcada no `.wasm` nem no studio.

## 4. Escopo e marcas

- A licença MIT de cada item cobre aquele item. Não cobre o software do
  simulador como um todo, a marca, eventuais imagens/assets do produto de
  origem nem o serviço.
- "Wokwi" é usado apenas para citar proveniência. O produto não usa a marca em
  nome, logo, domínio ou identificador; ver
  [`docs/adr/0006-identidade-e-defaults.md`](docs/adr/0006-identidade-e-defaults.md).
- "ESP32", "ESP32-C3" e "ESP32-C3-DevKitM-1" são marcas da Espressif Systems,
  usadas de forma descritiva para identificar o hardware simulado. O projeto
  não é afiliado, patrocinado ou endossado pela Espressif. O rodapé do studio
  publica esse aviso.
- Nenhum código, asset, imagem, modelo 3D ou dado proprietário do alvo foi
  copiado.

## 5. Manutenção

- Atualizar este arquivo quando uma nova dependência ou material de terceiros
  entrar no repositório.
- `npm run notices` (em `apps/studio`) regenera
  `public/THIRD_PARTY_LICENSES.txt`. O `prebuild` e o `npm test` falham se o
  arquivo estiver desatualizado.
- Registrar a obrigação (aviso, fonte, patente, marca) e o modo de uso.
- Seguir o checklist de release de `docs/08-riscos-e-licencas.md` §8.
