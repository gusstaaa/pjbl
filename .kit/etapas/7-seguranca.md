# Etapa 7 — Segurança (antes de qualquer pessoa de fora usar)

**Para dizer ao usuário:** "Antes de outra pessoa usar (até um amigo testando),
passamos por um checklist de segurança. É o que evita vazamento de dados e
prejuízo. Alguns itens são nos painéis das suas contas; eu te guio."

**Pré-requisito:** Etapa 6 ✅.
**Nasce aqui:** `SEGURANCA.md` (modelo no fim).

## Passos

### 7.1 Criar o `SEGURANCA.md` [Claude]
Preencha o §1 com o que o sistema guarda (do `REQUISITOS.md` §6 e §7) e o que
muda quando o 1º usuário real entrar.

### 7.2 Varreduras [Claude]
- Segredo no **histórico** do git, não só no estado atual:
  `git log -p | grep -cE "(sk-[A-Za-z0-9]|eyJ[A-Za-z0-9_-]{20}|://[^:/ ]+:[^@ ]+@)"`
  e `git log --all --oneline -- .env` (tem que voltar vazio). Nunca imprima o
  segredo encontrado: mostre só arquivo e commit.
- Rotas sem login: listar e justificar cada uma.
- Bibliotecas com vulnerabilidade alta (`npm audit`, `pip-audit`).
- Headers de segurança (HSTS, X-Frame-Options, nosniff, Referrer-Policy) e
  limite de tentativas no login e no "esqueci a senha".

### 7.3 Caminho do atacante [Claude]
Chamar as rotas **sem login** e **com login de outro usuário**. Se houver
vários clientes no sistema: criar dois clientes com dados **idênticos** e
varrer as rotas como A. Qualquer id do B na resposta é vazamento, inclusive
em contagens e somas.

### 7.4 Contas [usuário; Claude guia]
- Verificação em dois passos (MFA) no GitHub, no banco, na hospedagem e nos
  serviços que cobram.
- Trocar (rotacionar) as chaves usadas durante o desenvolvimento. Ordem:
  **provedor → hospedagem → `.env`** (na ordem errada o sistema cai). Anotar
  "última rotação" no `NOTAS.md` §2.

### 7.5 Backup [Claude + usuário]
Onde fica o backup automático e **teste de restauração** feito. Backup nunca
restaurado não conta.

### 7.6 LGPD (se guarda dado pessoal) [Claude explica; usuário decide]
Por que guarda (base legal), por quanto tempo, e como a pessoa pede para ver
ou apagar os dados. Assunto sensível (saúde, finanças, crianças): recomende
revisão de um profissional.

### 7.7 Plano de incidente [Claude escreve com o usuário]
Cinco linhas: quem é avisado, como tirar do ar, como restaurar.

### 7.8 Corrigir o que falhou
Cada falha vira item 🔴 e segue o ciclo da Etapa 6. Depois, marcar o gate.

## Nunca fazer
- Devolver token ou código de reset na resposta ("só em dev").
- Senha com hash sem salt (SHA-256 puro). Use bcrypt ou argon2.
- Aceitar refresh token como access token. Token em URL (vai parar no log).
- Confiar em "o repositório é privado": cópia e cache continuam existindo.

## Saída (tudo provado)
- [ ] Todo item do gate (`SEGURANCA.md` §4) marcado ou "não se aplica: motivo"
- [ ] Usuário confirmou os itens que só ele faz (MFA, rotação)
- [ ] Usuário aprovou seguir para a publicação

## Ao concluir
ROADMAP S.1 ✅. `ESTADO.md`: Etapa 7 ✅, Etapa 8 ▶, PRÓXIMO PASSO = "Etapa 8,
passo 8.1". Commit + push. Leia `.kit/etapas/8-publicacao.md`.

---

## Modelo: `SEGURANCA.md`

```markdown
# SEGURANÇA — <projeto>

## 1. O que protegemos
(que dado sensível o sistema guarda e o que muda quando o 1º usuário real entrar)

## 2. Verificações (AAAA-MM-DD)
| Verificação | Como foi feita | Resultado |
|---|---|---|

## 3. Achados
| # | Achado | Gravidade | Prova antes | Correção (commit) | Prova depois |
|---|---|---|---|---|---|

## 4. 🚦 Gate — ninguém de fora usa com item aberto
- [ ] Nenhum segredo no histórico do git (ou purgado + rotacionado)
- [ ] Chaves de desenvolvimento rotacionadas
- [ ] MFA nas contas administrativas
- [ ] Rotas sem login listadas e justificadas; caminho do atacante testado
- [ ] Isolamento entre clientes provado com 2 clientes idênticos (se houver vários)
- [ ] Bibliotecas sem vulnerabilidade alta
- [ ] Headers de segurança + limite de tentativas no login
- [ ] Backup automático + restauração testada
- [ ] Logs sem dado pessoal nem token
- [ ] LGPD: base legal, retenção, canal do titular (se houver dado pessoal)
- [ ] Plano de incidente escrito

## 5. O que esta revisão NÃO cobriu (candidato à próxima)
-

## 6. Revisões
| Data | O que mudou |
|---|---|
```

Revisão recorrente (mensal ou antes de cliente novo): repetir 7.2 e 7.3 e
registrar nova linha no §6.
