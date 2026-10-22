# Guia de Configuração: Ambiente Moderno C++23 no Windows 11

Este guia aborda o passo a passo completo para configurar um ambiente de desenvolvimento robusto para **C++23**, utilizando o gerenciador de pacotes **Scoop**, **Git**, **Python** e o **Visual Studio Code**, rodando 100% no **PowerShell em modo de usuário** (sem necessidade de privilégios de Administrador/UAC).

---

## Índice
1. [Requisitos e Filosofia de Instalação](#1-requisitos-e-filosofia-de-instalação)
2. [Passo 1: Habilitar Execução de Scripts no PowerShell](#passo-1-habilitar-execução-de-scripts-no-powershell)
3. [Passo 2: Instalação do Scoop](#passo-2-instalação-do-scoop)
4. [Passo 3: Instalação do Git e Adição dos Buckets Principais](#passo-3-instalação-do-git-e-adição-dos-buckets-principais)
5. [Passo 4: Instalação do Python](#passo-4-instalação-do-python)
6. [Passo 5: Instalação do Compilador e Ferramentas C++23](#passo-5-instalação-do-compilador-e-ferramentas-c23)
7. [Passo 6: Instalação e Configuração do VS Code](#passo-6-instalação-e-configuração-do-vs-code)
8. [Passo 7: Teste Prático com C++23](#passo-7-teste-prático-com-c23)
9. [Comandos Úteis de Manutenção](#comandos-úteis-de-manutenção)

---

## 1. Requisitos e Filosofia de Instalação

- **Sistema:** Windows 11.
- **Terminal:** PowerShell (`powershell.exe` ou `pwsh.exe`).
- **Permissões:** **Apenas Usuário Comum** (não execute como Administrador).
- **Por que o Scoop?** O Scoop instala programas dentro da pasta do seu perfil de usuário (`~\\scoop`), sem poluir o registro do Windows, sem exigir privilégios de superusuário e sem conflitar com variáveis de ambiente do sistema.

---

## Passo 1: Habilitar Execução de Scripts no PowerShell

Abra o seu terminal PowerShell comum (basta pressionar `Win + R`, digitar `powershell` e dar Enter).

Execute a política que permite a execução de scripts apenas para o seu usuário atual:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

---

## Passo 2: Instalação do Scoop

Com a política ajustada, instale o Scoop através do instalador oficial:

```powershell
irm get.scoop.sh | iex
```

> **Verificação:** Para conferir se foi instalado com sucesso, digite:
> ```powershell
> scoop --version
> ```

---

## Passo 3: Instalação do Git e Adição dos Buckets Principais

O Git é a dependência base do Scoop para clonar repositórios de pacotes extras (*buckets*).

1. Instale o Git:
   ```powershell
   scoop install git
   ```

2. Adicione os *buckets* comunitários oficiais (`extras` e `main`):
   ```powershell
   scoop bucket add extras
   scoop update
   ```

---

## Passo 4: Instalação do Python

Instale a versão estável do Python:

```powershell
scoop install python
```

> **Verificação:**
> ```powershell
> python --version
> pip --version
> ```

---

## Passo 5: Instalação do Compilador e Ferramentas C++23

Para compilar códigos utilizando o padrão **ISO C++23** de forma nativa e sem necessidade do pesado instalador do Visual Studio C++, utilizaremos a distribuição **WinLibs (GCC/MinGW-w64)** com suporte avançado a módulos, `std::print`, ranges e corrotinas, além de ferramentas de automação de build (`CMake` e `Ninja`).

1. Instale a toolchain C/C++:
   ```powershell
   scoop install winlibs-mingw-ucrt
   ```
   *(A variante UCRT utiliza o runtime moderno da Microsoft integrado ao Windows 10/11).*

2. Instale o CMake e o Ninja:
   ```powershell
   scoop install cmake ninja
   ```

3. **Verifique se o compilador está pronto:**
   ```powershell
   g++ --version
   cmake --version
   ninja --version
   ```

---

## Passo 6: Instalação e Configuração do VS Code

1. Instale a versão de usuário do Visual Studio Code via Scoop:
   ```powershell
   scoop install vscode
   ```

2. Feche e abra o terminal (ou recarregue as variáveis de ambiente) e instale as extensões essenciais para C++ e CMake:
   ```powershell
   code --install-extension ms-vscode.cpptools
   code --install-extension ms-vscode.cmake-tools
   code --install-extension twxs.cmake
   ```

---

## Passo 7: Teste Prático com C++23

Vamos criar um pequeno projeto demonstrativo usando novidades do C++23, como `<print>` e formatação nativa.

1. Crie uma pasta para o projeto e entre nela:
   ```powershell
   mkdir $HOME\Projetos\cpp23-demo
   cd $HOME\Projetos\cpp23-demo
   ```

2. Crie o arquivo `main.cpp`:
   ```powershell
   @'
   #include <print>
   #include <vector>
   #include <numeric>

   int main() {
       std::vector<int> numbers = {10, 20, 30, 40, 50};
       int soma = std::accumulate(numbers.begin(), numbers.end(), 0);

       // std::println faz parte do padrão C++23
       std::println("Olá, C++23 no Windows 11 com Scoop!");
       std::println("A soma dos valores é: {}", soma);

       return 0;
   }
   '@ | Out-File -FilePath main.cpp -Encoding utf8
   ```

3. Compile manualmente com a flag `-std=c++23`:
   ```powershell
   g++ -std=c++23 -O2 main.cpp -o main.exe
   ```

4. Execute o binário gerado:
   ```powershell
   .\main.exe
   ```

### Usando no VS Code

Abra a pasta diretamente pelo PowerShell:
```powershell
code .
```

No VS Code:
- Pressione `Ctrl + Shift + P` e busque por **C/C++: Edit Configurations (UI)**.
- Defina o **Compiler Path** para o caminho do seu `g++.exe` (geralmente em `$HOME\scoop\apps\winlibs-mingw-ucrt\current\bin\g++.exe`).
- Defina o **C++ standard** como `c++23`.

---

## Comandos Úteis de Manutenção

- **Atualizar todos os pacotes instalados:**
  ```powershell
  scoop update *
  ```
- **Remover versões antigas e limpar cache de download:**
  ```powershell
  scoop cleanup *
  scoop cache rm *
  ```
- **Listar ferramentas instaladas:**
  ```powershell
  scoop list
  ```