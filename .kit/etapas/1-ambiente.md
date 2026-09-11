# Etapa 1 — Boas-vindas e computador pronto

**Para dizer ao usuário:** "Nesta etapa a gente se conhece, dá um nome ao
projeto e deixa seu computador pronto. Você não precisa saber nada técnico:
eu faço e te explico."

**Pré-requisito:** nenhum. É o começo.

## Passos

### 1.1 Apresentação [Claude]
Em até 8 linhas:
- como funciona: 8 etapas, uma de cada vez, cada uma termina com um teste;
- a divisão: ele decide e aprova; você executa e explica; ele só faz o que
  exige a pessoa dele (contas, logins, senhas, aprovar, testar clicando);
- como voltar outro dia ("continuar") e como parar ("encerrar");
- que ele pode perguntar qualquer coisa, a qualquer momento.
Mostre a Trilha das 8 etapas do `ESTADO.md`.

### 1.2 Conhecer o usuário e o projeto [Claude pergunta]
1. Como posso te chamar?
2. Em uma ou duas frases, qual é a ideia? (Não precisa estar pronta: a
   Etapa 3 detalha.)
3. Que nome você quer dar ao projeto?

Proponha o **nome da pasta** (minúsculas, sem acento nem espaço, ex.:
`agenda-salao`) e confirme. Grave nome do projeto e do responsável no topo do
`CLAUDE.md` e no cabeçalho do `ESTADO.md`. A ideia vai em "Anotado para
depois" (será usada na Etapa 3).

### 1.3 Já existe código? [Claude]
Liste a pasta. Se houver algo além dos arquivos do kit (`LEIA-ME.md`,
`CLAUDE.md`, `ESTADO.md`, `.kit/`, `.claude/`), pergunte se é um projeto já
começado. Se for: siga `.kit/continuidade.md` antes de continuar.

### 1.4 Onde o projeto vai morar [Claude]
Rode `uname -s` e `pwd`.
- **WSL com a pasta em `/mnt/c/...`** (disco do Windows): explique que ali fica
  lento e dá erro de permissão, e proponha mover para `~/projetos/<pasta>`.
  Com o ok:
  ```bash
  mkdir -p ~/projetos && cp -r . ~/projetos/<pasta>   # copia; não apaga o original
  ls -la ~/projetos/<pasta>                           # confere que chegou tudo
  ```
  Atualize o `ESTADO.md` **da pasta nova** (campo Pasta; PRÓXIMO PASSO =
  "Etapa 1, passo 1.5"). Diga ao usuário: "Digite `/exit`. Depois digite
  `cd ~/projetos/<pasta>` e `claude`. Ele vai perguntar se confia na pasta:
  responda sim. Então escreva **continuar**." A pasta antiga fica como está;
  ele apaga depois, se quiser.
- **Mac ou Linux nativo:** se estiver em Downloads ou Área de Trabalho, sugira
  `~/projetos/<pasta>` do mesmo jeito.
- **Windows sem WSL** (PowerShell/cmd): explique que o kit precisa do Linux e
  aponte o passo 1 do `LEIA-ME.md`. Não siga sem isso.

### 1.5 Ferramentas básicas [Claude confere; usuário instala se faltar]
```bash
git --version; curl --version | head -1
```
Faltou algo?
- Ubuntu/WSL: janela de apoio →
  `sudo apt update && sudo apt install -y git curl build-essential`
- Mac: janela de apoio → `xcode-select --install` (abre uma janela; clicar em
  Instalar).

> Ferramentas da linguagem (Node, Python…) só na Etapa 5, depois de a stack
> ser escolhida. Não instale nada além disso agora.

### 1.6 Ver os arquivos [Claude mostra uma vez]
No WSL, `explorer.exe .` abre a pasta do projeto no Windows. Mostre, para ele
saber onde as coisas ficam.

## Saída (tudo provado)
- [ ] Nome do usuário e do projeto gravados no `CLAUDE.md` e no `ESTADO.md`
- [ ] `pwd` mostra uma pasta do Linux/Mac (não `/mnt/c/...`)
- [ ] `git --version` e `curl --version` respondem
- [ ] Usuário sabe voltar ("continuar") e parar ("encerrar"): pergunte

## Ao concluir
`ESTADO.md`: Etapa 1 ✅ com data, Etapa 2 ▶, PRÓXIMO PASSO = "Etapa 2, passo
2.1". Ainda não há git: sem commit. Leia `.kit/etapas/2-cofre.md` e siga.
