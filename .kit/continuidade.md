# Modo continuidade — projeto que já tem código

**Quando usar:** na Etapa 1 (passo 1.3) a pasta já tem código, ou o projeto
ficou mais de 1 mês parado sem atualizar os documentos.

**Para dizer ao usuário:** "Seu projeto já tem coisa feita. Antes de seguir,
vou levantar o que existe de verdade, para a gente não refazer nada nem
confiar em anotação velha."

Marque cada achado: ✅ bate com o que está escrito · ➕ existe mas não está
documentado · ❌ está escrito mas não existe.

## Levantamento [Claude]
1. **Estrutura e stack:** `git ls-files | head -200` (ou listar a pasta);
   identificar a stack (package.json, requirements.txt…), rotas, telas e
   scripts.
2. **Banco:** listar as tabelas reais, por nome (não só a contagem), e as
   tabelas sem proteção.
3. **Rodar:** tentar ligar o sistema e rodar os testes que existirem. Anotar o
   resultado **real**, não o esperado.
4. **Histórico:** `git log --oneline -30` e `git status -sb`. O que está no ar
   é a mesma versão da `main`?
5. **Segurança rápida:** `git ls-files | grep -E '\.env$'` (tem que voltar
   vazio) e segredo no histórico (`git log -p | grep -ciE "password=|secret_key=|api_key="`).
6. **Explicar ao usuário**, em linguagem simples: o que existe, o que funciona,
   o que está quebrado e os riscos.

Registre o resumo em "Em andamento" do `ESTADO.md` até existir o `NOTAS.md`.

## Como as etapas continuam
- **Etapa 1:** normal (nome, pasta, ferramentas).
- **Etapa 2:** se já há git/GitHub, só conferir: repositório privado, `.env`
  fora do git, push em dia. `.env` ou segredo no histórico → avisar o usuário
  já e tratar na Etapa 7 (rotacionar).
- **Etapa 3:** o `REQUISITOS.md` descreve o que o sistema **já faz** (do
  levantamento) + o que falta. Aprovar normalmente.
- **Etapa 4:** o `ROADMAP.md` marca ✅ o que já existe e funciona ("confirmado
  no código em AAAA-MM-DD"); o resto entra na fila.
- **Etapa 5:** a Fase 0 vira conferência: o que já liga fica ✅; o que falta
  (health, smoke, `NOTAS.md`) é feito. O levantamento vai para o `NOTAS.md`.
- **Etapas 6 a 8:** normais.
