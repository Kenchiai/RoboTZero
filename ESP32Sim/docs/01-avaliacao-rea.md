# 01 — Avaliação do REA como ferramenta de reengenharia

- **Data da avaliação:** 2026-10-22
- **Alvo avaliado:** <https://github.com/morluto/rea>
- **Escopo:** uso do REA para levantar evidências de interoperabilidade do
  frontend/serviço do Wokwi e de artefatos públicos, não para copiar o produto.

## 1. Resumo executivo

O REA é uma ferramenta **local, MIT, baseada em MCP e CLI** para investigação de
aplicações, binários e comportamento. Ele é excelente para responder perguntas
do tipo **“como esta aplicação se comporta e quais artefatos ela usa?”** com
cadeia de evidência. Não é um emulador, não gera modelos de CPU/periférico e
não substitui datasheets, TRMs, QEMU ou hardware real.

**Veredito:** adotar o REA como **ferramenta opcional de evidência na Fase 0 e
em verificações de compatibilidade**, não como dependência do produto. O core
C++23 deve ser especificado a partir de fontes públicas, testes e traces; o REA
serve para mapear o comportamento observável do Wokwi e de artefatos web.

| Dimensão | Nota (0–5) | Comentário |
| --- | --- | --- |
| Observação de aplicação web | 5 | CDP passivo, DOM, scripts, rede, WebSocket, screenshots |
| Análise estática de JavaScript/Electron | 5 | Grafo de módulos, rotas, endpoints, source maps |
| Análise de binário nativo | 3 | Depende de Hopper/Ghidra/IDA; Ghidra no Windows é experimental |
| Análise de firmware | 2 | Binwalk/Unblob são Linux; não há emulação |
| Análise de WASM | 3 | Inspeção estática com WABT; não executa o WASM |
| Captura de processos/sinais | 1 | Processos em Linux/macOS; sinais em Linux |
| Geração de modelo de emulação | 0 | Fora do escopo da ferramenta |
| Cadeia de evidência/auditoria | 5 | IDs, proveniência, limitações e exportação |
| Praticidade no Windows 11 | 3 | Web/JS funciona; partes nativas exigem WSL2/Ghidra |

## 2. O que o REA é

- Servidor MCP local + CLI com os mesmos contratos.
- Analisa **sem executar** o alvo na maioria dos fluxos estáticos.
- Pode se conectar a um Chrome/Chromium já aberto via CDP para observação
  passiva (sem `Runtime.evaluate`, sem automação arbitrária).
- Retorna resultados com **Evidence**: autoridade, cobertura, limitações e
  proveniência.
- Integra-se ao OpenCode via `npx rea-agents@latest setup --client opencode`.
- Licença MIT; ferramentas externas (Hopper, Ghidra, IDA, JADX, WABT, etc.)
  mantêm suas próprias licenças.

## 3. Estado do ambiente local

Verificado em 2026-10-22:

| Item | Estado | Consequência |
| --- | --- | --- |
| Windows 11 + PowerShell 5.1 | OK | Fluxos web/JS são viáveis |
| Node.js | **v22.18.0** | **Bloqueado**: o REA exige 22.x ≥ 22.19, 24.x ≥ 24.11 ou 26+ |
| npm | 10.9.3 | OK |
| Git | 2.56.0 | OK |
| Google Chrome | presente em `C:\Program Files\Google\Chrome\Application\chrome.exe` | Permite CDP |
| WSL2 | não verificado | Recomendado para binwalk/unblob e Ghidra |
| Ghidra/Hopper/IDA | não verificado | Necessário apenas para binários nativos |

**Ação obrigatória antes de usar o REA:** atualizar o Node.js (via `nvm-windows`,
`fnm`, Volta ou instalador oficial) e confirmar uma versão compatível: 22.x ≥
22.19, 24.x ≥ 24.11 ou 26+.

## 4. Capacidades relevantes para o ESP32Sim

### 4.1 Observação do Wokwi no navegador

O REA pode:

- listar alvos de página e restringir por origem;
- capturar DOM, acessibilidade, scripts, recursos, workers, rede, console,
  WebSocket e storage (nomes/fingerprints);
- capturar screenshot do viewport;
- observar uma janela de sessão enquanto o usuário executa uma ação;
- exportar scripts capturados para análise estática;
- comparar capturas e screenshots entre versões.

**Uso no projeto:** descobrir o **contrato observável** do Wokwi — formato de
projeto, endpoints, sequência de compilação, mensagens de simulação, metadados
de placas/componentes e fluxos de UI. Isso alimenta especificações, não código
copiado.

### 4.2 Análise estática de JavaScript

- Grafo de módulos, imports, rotas, endpoints e source maps.
- Trace de funcionalidades por string, rota, API, módulo ou canal.
- Comparação entre versões e entre fonte histórica e bundle.
- Inspeção de formatos de retorno de exports.

**Uso no projeto:** entender como o frontend do Wokwi serializa projetos,
resolve pinos, carrega partes e se comunica com o backend. Também pode ser
usado para auditar nossos próprios bundles.

### 4.3 WASM e binários

- `inspect_wasm_artifact` com WABT: validação, seções, imports/exports e WAT.
- Análise nativa via Ghidra (Windows P0 experimental) ou Hopper (macOS).
- Inspeção de ELF/PE, notas, símbolos, relocations e mitigations.

**Uso no projeto:** inspecionar artefatos WASM **obtidos legalmente** (por
exemplo, um WASM público do Wokwi ou o nosso próprio binário) para entender a
superfície de imports/exports e o carregamento. Não usar para burlar proteções.
Para o nosso core, o mais útil é inspecionar o **nosso** WASM e comparar com o
build nativo.

### 4.4 O que o REA não faz

- Não emula Xtensa, RISC-V, GPIO, UART, Wi-Fi ou BLE.
- Não infere ciclo a ciclo o comportamento de um periférico.
- Não recupera o código-fonte de um emulador proprietário a partir do
  comportamento.
- Não substitui TRM/datasheet, testes em hardware ou QEMU.
- Não captura processos no Windows.
- Não garante cobertura de comportamentos server-side; só observa o que o
  cliente vê.
- Não remove obrigações de licença, EULA ou direitos autorais.

## 5. Limites jurídicos e de uso

Esta é uma avaliação de engenharia, não parecer jurídico.

Antes de observar o Wokwi:

1. Leia os **Termos de Uso**, a **EULA** e a política de privacidade aplicáveis.
2. Verifique se os termos permitem engenharia reversa/observação para
   interoperabilidade. Se houver cláusula proibitiva, **não use o REA** no alvo;
   siga apenas com fontes públicas e documentação.
3. Não contorne autenticação, paywall, rate limit ou proteção técnica.
4. Não copie código, CSS, HTML, modelos 3D, imagens, fontes ou dados.
5. Não use credenciais de terceiros; use uma conta/perfil dedicado e um
   navegador isolado.
6. Não faça scraping em massa nem sobrecarregue o serviço.
7. Registre a base legal e a data da observação em cada evidência.

Se a revisão jurídica não concluir em tempo, a Fase 0 segue sem REA, usando
apenas: documentação pública do Wokwi, datasheets/TRMs da Espressif, firmware
open-source, avr8js/wokwi-elements (MIT), QEMU (GPL, com revisão) e hardware
real.

## 6. Fluxo recomendado no Windows

### 6.1 Pré-requisitos

```powershell
# 1) Atualize o Node.js para 22.x >= 22.19, 24.x >= 24.11 ou 26+
node --version

# 2) Instale/registre o REA para o OpenCode
npx rea-agents@latest setup --client opencode

# 3) Reinicie o OpenCode para carregar o MCP
npx rea-agents@latest doctor --client opencode --json
```

### 6.2 Navegador isolado para CDP

```powershell
$profile = Join-Path $env:TEMP "rea-wokwi-profile"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir=$profile `
  --no-first-run `
  --no-default-browser-check `
  https://wokwi.com
```

Use apenas `127.0.0.1`; nunca exponha a porta de debug na rede.

### 6.3 Coleta

```powershell
# Descobrir o alvo
npx -y rea-agents@latest list-browser-targets http://127.0.0.1:9222 `
  --allowed-origins https://wokwi.com --json

# Inspecionar a página (depois de substituir TARGET_ID)
npx -y rea-agents@latest inspect-web-page http://127.0.0.1:9222 TARGET_ID `
  --include-accessibility-text --include-script-sources `
  --include-storage-keys --include-json-body-shapes --json

# Observar uma ação conhecida (ex.: abrir um projeto e iniciar a simulação)
npx -y rea-agents@latest observe-web-session http://127.0.0.1:9222 TARGET_ID `
  --observation-ms 15000 --json

# Analisar o bundle estático
npx -y rea-agents@latest analyze-web-bundle http://127.0.0.1:9222 TARGET_ID --json

# Exportar scripts para análise local
npx -y rea-agents@latest export-web-scripts http://127.0.0.1:9222 TARGET_ID --json
```

### 6.4 Tratamento da evidência

- Salvar JSON bruto em `ESP32Sim/evidence/<data>/<tema>/`.
- Calcular SHA-256 dos arquivos e do alvo (quando aplicável).
- Escrever uma ficha em `ESP32Sim/evidence/<data>/<tema>/README.md` com:
  pergunta, hipótese, comando, resultado, limitações, base legal e conclusão.
- Nunca colar tokens, cookies, headers de autorização ou dados pessoais.
- Conversar com `clean-room-auditor` antes de transformar evidência em
  especificação de implementação.

## 7. O que esperar de cada fluxo

| Pergunta do projeto | Fluxo REA | Confiança | Limite |
| --- | --- | --- | --- |
| Como o projeto é serializado? | `observe-web-session` + bundle | Média | Pode ser server-side ou minificado |
| Quais endpoints a compilação usa? | rede/JS bundle | Alta | Pode haver ofuscação/assinatura |
| Como pinos e partes são descritos? | DOM + JS + catálogo público | Média | Ativos proprietários não podem ser copiados |
| Como o serial é transportado? | WebSocket/console/rede | Média | Protocolo pode ser binário |
| Como o Wokwi carrega o emulador? | scripts/rede/WASM | Média | Uso do WASM é limitado por licença |
| Como o ESP32 se comporta no ciclo? | **não responde** | — | Usar TRM/QEMU/hardware |
| Quais registradores o periférico usa? | **não responde** | — | Usar TRM/testes |
| Como simular Wi-Fi? | **não responde** | — | Usar lwIP/SLIRP + testes |

## 8. Riscos específicos do REA

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| ToS do Wokwi proibir engenharia reversa | Média | Alto | Revisão jurídica; plano B sem REA |
| Bundle minificado sem source maps | Alta | Médio | Análise estática + observação de comportamento |
| Protocolo binário difícil de inferir | Média | Médio | Captura de WebSocket; testes controlados |
| Falso senso de completude | Média | Alto | Exigir limitações e testes independentes |
| Vazamento de credenciais | Baixa | Alto | Perfil isolado, redaction, nunca colar tokens |
| Dependência de ferramenta externa | Média | Médio | REA é opcional; contratos e specs são a fonte |
| Node antigo bloquear setup | Alta | Baixo | Atualizar antes da Fase 0 |

## 9. Decisão

**Adotar condicionalmente.** O REA entra no fluxo da Fase 0 como ferramenta de
descoberta e auditoria de evidência, com as seguintes condições:

1. Node.js atualizado e `doctor` saudável.
2. Revisão de ToS/EULA concluída.
3. Perfil de navegador isolado e sem credenciais sensíveis.
4. Evidência registrada e revisada pelo `clean-room-auditor`.
5. Nenhum código/asset proprietário copiado para o repositório.
6. O core C++23 não depende do REA em build, runtime ou CI.

**Investimento estimado:** 3–5 dias de Fase 0 para setup, captura e síntese;
1 dia por ciclo de compatibilidade futuro.

## 10. Alternativas e complementos

| Ferramenta | Papel | Licença/observação |
| --- | --- | --- |
| Datasheets/TRMs Espressif | Fonte primária de comportamento | Pública; citar versão |
| ESP-IDF + Arduino core | Firmware de teste e boot | Apache-2.0/LGPL; verificar |
| QEMU (lcgamboa) | Oráculo de CPU/periféricos | GPLv2; revisar distribuição |
| avr8js | Referência de emulação AVR (não ESP32) | MIT |
| wokwi-elements | Referência visual de componentes | MIT; verificar assets |
| Velxio | Referência de arquitetura multi-board | AGPLv3; **não copiar** |
| WABT | Inspeção de WASM | Apache-2.0 |
| GDB/OpenOCD | Depuração e traces | GPL; uso como ferramenta |
| Hardware real | Verdade de campo | Custo e disponibilidade |

## 11. Conclusão

O REA **não é o atalho para reconstruir o emulador do Wokwi**. Ele é um
acelerador de descoberta e um caderno de evidências. O valor real do ESP32Sim
virá de:

- um core C++23 bem projetado e testado;
- uma especificação de SoC/periféricos baseada em TRM e firmware;
- uma suíte de conformidade forte;
- uma interface 3D que não interfere no timing;
- uma operação de Cloudflare barata e segura.

O REA pode economizar semanas no entendimento do **frontend e dos contratos
observáveis**, desde que usado com disciplina clean-room e sem violar termos
aplicáveis.
