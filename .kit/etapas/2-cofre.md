# Etapa 2 — Cofre do código (Git + GitHub)

**Para dizer ao usuário:** "Agora vamos criar o cofre do projeto. O Git guarda
cada versão do que fizermos (dá para voltar atrás) e o GitHub guarda uma cópia
na internet: se seu computador quebrar, nada se perde. É grátis."

**Pré-requisito:** Etapa 1 ✅.
**Nasce aqui:** `.gitignore` e `.env.example` (modelos no fim deste arquivo).

## Passos

### 2.1 Conta no GitHub [usuário]
Pergunte se já tem. Se não: github.com → **Sign up** → e-mail, senha, nome de
usuário → código que chega no e-mail. Peça que avise ao terminar e diga o
**nome de usuário** (nunca a senha). Recomende a verificação em dois passos
(Settings → Password and authentication): agora ou, no máximo, na Etapa 7.

### 2.2 Identidade do Git [Claude pergunta e executa]
Pergunte o nome e o e-mail que vão assinar as versões (pode ser o do GitHub).
```bash
git config --global user.name  "NOME"
git config --global user.email "EMAIL"
git config --global init.defaultBranch main
```

### 2.3 Ligar este computador ao GitHub [usuário digita; Claude conduz]
1. Confira `gh --version`. Faltando: janela de apoio →
   Ubuntu `sudo apt update && sudo apt install -y gh` · Mac `brew install gh`
   (sem Homebrew: instruções em cli.github.com).
2. Antes do login, explique o que ele vai responder:
   **GitHub.com → HTTPS → Yes → Login with a web browser** → copiar o código
   de 8 letras → Enter → no navegador, colar o código → **Authorize**. Se o
   navegador não abrir sozinho, abrir `github.com/login/device`.
3. Janela de apoio: `gh auth login`
4. Você confere: `gh auth status` e roda `gh auth setup-git`.

### 2.4 Criar o cofre local [Claude]
```bash
git init
```
Crie `.gitignore` e `.env.example` pelos modelos. Primeiro commit:
```bash
git add .
git status            # confira: nenhum .env na lista
git commit -m "chore: início do projeto com o kit"
```

### 2.5 Criar o repositório no GitHub [Claude, com confirmação]
Diga: "vou criar um repositório **privado** chamado `<pasta>` na sua conta".
Com o ok:
```bash
gh repo create <pasta> --private --source=. --push
```
Sempre **privado**. Mostre o link (`gh repo view --json url -q .url`) e peça
que ele abra e veja os arquivos lá.

### 2.6 Combinar a rotina [Claude]
"A partir de agora, ao fim de cada sessão eu salvo tudo no GitHub. Você só
precisa dizer **encerrar**."

## Saída (tudo provado)
- [ ] `gh auth status` mostra logado
- [ ] `gh repo view --json visibility -q .visibility` = `PRIVATE`
- [ ] `git status -sb` sem `ahead`
- [ ] `git check-ignore .env` responde `.env` (o segredo nunca sobe)
- [ ] Usuário viu os arquivos no site do GitHub

## Ao concluir
`ESTADO.md`: Etapa 2 ✅, Etapa 3 ▶, "Salvo no GitHub? sim", PRÓXIMO PASSO =
"Etapa 3, bloco A". Commit + push. Leia `.kit/etapas/3-requisitos.md`.

---

## Modelo: `.gitignore`
```gitignore
# segredos: NUNCA versionar
.env
.env.*
*.env
!.env.example
# ambientes e dependências
.venv/
venv/
node_modules/
__pycache__/
dist/
build/
.next/
# sistema
.DS_Store
Thumbs.db
```

## Modelo: `.env.example`
```env
# Copie para .env e preencha. O .env nunca vai para o GitHub.
# As chaves (SEM valores) são acrescentadas aqui na Etapa 5, conforme o projeto precisar.
```
