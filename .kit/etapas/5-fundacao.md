# Etapa 5 — Fundação (ligar as peças)

**Para dizer ao usuário:** "Agora montamos a base: instalo as ferramentas,
criamos as contas dos serviços que o sistema usa, conectamos tudo e provamos
que o sistema liga. No fim desta etapa você abre o sistema no navegador pela
primeira vez (ainda vazio)."

**Pré-requisito:** Etapa 4 ✅. Segue os itens da Fase 0 do `ROADMAP.md`.
**Nasce aqui:** `NOTAS.md` (modelo no fim), `.env`, `start.sh`,
`scripts/smoke.sh` e o esqueleto do sistema.

## Passos

### 5.1 Ferramentas da stack [Claude] — ROADMAP 0.1
Instale só o que a stack aprovada precisa. Prefira instalação sem `sudo`
(ex.: Node pelo nvm; Python com `venv`). Precisou de `sudo`: janela de apoio.

### 5.2 Contas dos serviços [usuário; Claude guia] — ROADMAP 0.2
Só os que estão no `REQUISITOS.md` §8 e §10. **Um serviço por vez:**
1. Explique o que é e quanto custa (grátis até quanto).
2. Guie a criação da conta, clique por clique. Recomende guardar a senha num
   gerenciador de senhas (ex.: Bitwarden, grátis): o original de todo segredo
   fica lá; o `.env` é só uma cópia.
3. **Limite de gasto configurado antes de gerar qualquer chave** (serviço pago
   por uso: IA, e-mail, SMS).
4. Banco: região mais próxima de onde o sistema vai rodar (longe = cada
   consulta mais lenta).
5. Acrescente o **nome** da chave no `.env.example` (sem valor).

### 5.3 Preencher o `.env` [usuário]
1. Você cria: `cp .env.example .env`
2. Você abre para ele: WSL `notepad.exe .env &` (se não abrir: `explorer.exe .`
   e ele abre o `.env` com o Bloco de Notas) · Mac `open -e .env`.
3. Explique o formato: `NOME=valor`, uma por linha, sem espaço e sem aspas.
   Ele cola cada valor, salva (Ctrl+S) e fecha.
4. Você confere **sem exibir**: `grep -q '^NOME=.' .env && echo ok` para cada
   chave, e `git check-ignore .env`.

### 5.4 Esqueleto + `start.sh` [Claude] — ROADMAP 0.3
Estrutura mínima da stack. `start.sh` sobe tudo e faz um healthcheck. Scripts
calculam a própria raiz (`cd "$(dirname "$0")"`): **nunca caminho absoluto nem
nome de máquina** em script ou documento. Só as dependências da stack aprovada.

### 5.5 Banco [Claude] — ROADMAP 0.4
- 1ª alteração de banco numerada (ex.: `infra/001_inicio.sql` ou o padrão da
  ferramenta), com a tabela **protegida na mesma alteração** (Supabase:
  `ALTER TABLE x ENABLE ROW LEVEL SECURITY`).
- **Confira que rodou** com consulta real: script de migração pode dizer
  "sucesso" sem ter executado.
- `/health` (processo vivo) e `/health/db` (faz um `SELECT 1` de verdade: um
  `/health` que não toca o banco responde OK com o banco caído).

### 5.6 Smoke + `NOTAS.md` + validação [Claude] — ROADMAP 0.5
- `scripts/smoke.sh`: chama as rotas vivas, imprime `OK N · FALHA M` e sai com
  erro se algo falhar.
- Preencha no `CLAUDE.md` §7 os comandos reais de tipos e lint.
- Crie o `NOTAS.md` (modelo): ambiente, integrações (sem valores!), scripts,
  banco.

### 5.7 Mostrar ao usuário [usuário testa]
Rode `bash start.sh`. Peça que ele abra `http://localhost:PORTA` no navegador e
diga o que aparece.

## Testes de conexão (adapte à stack)
- **Banco:** script curto que lê a URL do `.env` e roda `select version()` →
  "banco ok".
- **API externa:** chamada mínima autenticada (ex.: listar modelos) → 200.
  `401` = chave errada, revogada ou sem crédito.
- **Health:** `curl -s localhost:PORTA/health` e `/health/db`. Só o 1º
  responde? O banco está fora.

## Pegadinhas conhecidas
| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `tenant not found` / timeout no banco | Supabase grátis pausa após ~7 dias parado | Painel → Restore (keepalive na Etapa 8) |
| Conexão Supabase falha | String errada para a rede | Direta 5432 (migrações, IPv6) · pooler session 5432 (IPv4) · pooler transaction 6543 (serverless; com asyncpg exige `statement_cache_size=0`) |
| `password authentication failed` | Senha trocada ou string errada no `.env` | Pegar a string de novo no painel (Connect) |
| `address already in use` | Processo antigo rodando | `lsof -i :PORTA` e encerrar |
| "Erro de CORS" no navegador | Origem não liberada **ou** API caiu antes de responder | Testar com `curl`; conferir origens liberadas |
| Rota nova dá 404 | Servidor sem reload, código velho | Reiniciar e confirmar com `ps` |

## Saída (tudo provado)
- [ ] `bash start.sh` sobe tudo e o healthcheck passa
- [ ] `/health` e `/health/db` OK (ou "não se aplica: sem banco")
- [ ] Cada serviço do `REQUISITOS.md` §8 testado por comando, com limite de gasto
- [ ] Todas as chaves preenchidas no `.env`; `git status` não mostra o `.env`
- [ ] `bash scripts/smoke.sh` → 0 falhas
- [ ] `CLAUDE.md` §7 com os comandos de validação reais
- [ ] `NOTAS.md` criado
- [ ] Usuário abriu o sistema no navegador
- [ ] Fase 0 do `ROADMAP.md` toda ✅

## Ao concluir
`ESTADO.md`: Etapa 5 ✅, Etapa 6 ▶, PRÓXIMO PASSO = "ROADMAP 1.1 — <título>".
Commit + push. Leia `.kit/etapas/6-construcao.md`.

---

## Modelo: `NOTAS.md`

```markdown
# NOTAS — referência técnica de <projeto>

> Consultar quando faltar contexto e **antes de escrever código** (§6). Não precisa ler toda sessão.
> Aqui não entra caminho absoluto, nome de máquina nem senha.

## 1. Ambiente e como ligar
| Peça | Versão | Porta / onde |
|---|---|---|
- 1ª vez numa máquina nova: …
- Toda vez: `bash start.sh`
- Pegadinhas do ambiente: …

## 2. Integrações e credenciais (NUNCA os valores)
| Serviço | Para quê | Chave no .env | Limite de gasto | Plano B se cair | Última rotação |
|---|---|---|---|---|---|

## 3. Scripts
| Script | O que faz | Quando rodar | Trava de segurança |
|---|---|---|---|
> Script que apaga dado: simulação por padrão e `--executar` explícito.

## 4. Banco (consultar antes de criar tabela: reaproveitar antes de criar)
| Alteração | Tabelas / mudança | Protegida? | Data | ROADMAP |
|---|---|---|---|---|
Pegadinhas do banco: …

## 5. Mapa do sistema (lógica → rota → tela)
| Módulo | Lógica (serviço) | Rotas | Telas |
|---|---|---|---|

## 6. Erros já enfrentados (consultar AO ESCREVER, não só ao depurar)
| Data | Sintoma | Causa real | Lição (regra que evita a família do erro) |
|---|---|---|---|

## 7. Decisões (técnicas e de negócio)
| Data | Decisão | Motivo | Alternativa descartada | Validada pelo usuário? |
|---|---|---|---|---|

## 8. Rotina de manutenção (Etapa 8)
```
