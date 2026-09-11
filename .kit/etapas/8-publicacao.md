# Etapa 8 — Publicação e rotina

**Para dizer ao usuário:** "Última etapa: colocar o sistema no ar, com um
endereço na internet, e combinar a rotina para ele continuar vivo."

**Pré-requisito:** Etapa 7 ✅ (gate completo).
**Nasce aqui:** `.github/workflows/keepalive.yml` (só se o banco grátis pausa).

## Passos

### 8.1 Hospedagem [usuário cria a conta; Claude guia]
A escolhida no `REQUISITOS.md` §10. Conectar ao repositório do GitHub (opção
"Deploy from GitHub" ou equivalente).

### 8.2 Variáveis [usuário]
Liste os **nomes** das chaves (do `.env.example`). O usuário copia os valores
do gerenciador de senhas para o painel da hospedagem (Variables). O `.env` não
sobe junto, e é assim que tem que ser. Use as chaves rotacionadas na Etapa 7.

### 8.3 Health check [Claude guia]
Configurar o health check do painel para `/health`.

### 8.4 Aprovação [usuário]
"Vou publicar a versão `<commit>`. Depois disso, qualquer pessoa com o link
acessa. Posso?" Só com "sim" explícito.

### 8.5 Conferir que publicou de verdade [Claude]
- `git status -sb` sem `ahead`: o código chegou ao GitHub.
- A versão servida é a atual: rota `/version` com o hash do commit, ou contar
  as rotas publicadas e comparar com o local. Health 200 também responde na
  versão velha.
- Não publicou? Um push novo é a 1ª tentativa; depois, o log no painel.

### 8.6 Usuário testa no endereço público
Percorrer a jornada principal no celular e/ou no computador (o que o
`REQUISITOS.md` §6 exigir).

### 8.7 Manter vivo [Claude]
- Banco grátis que pausa (Supabase: ~7 dias sem uso): criar o keepalive
  (modelo abaixo). O usuário cadastra a URL do `/health/db` como segredo,
  numa janela de apoio: `gh secret set URL_HEALTH_DB -R <usuario>/<repo>`
  (cola a URL quando pedir). Rodar uma vez pela aba **Actions** para testar.
- Monitoramento externo simples (ex.: UptimeRobot, grátis) chamando
  `/health/db` e avisando no e-mail dele. Tem que checar o **banco**, não só
  o processo.

### 8.8 Rotina [Claude registra no `NOTAS.md` §8 e explica]
- **Toda sessão:** "continuar" → você faz `git pull`, sobe o sistema e confere
  o banco.
- **Toda semana** (quando ele disser "rotina semanal"): keepalive rodando (aba
  Actions), `npm audit`/`pip-audit`, gasto das APIs dentro do limite.
- **Todo mês:** revisar o `SEGURANCA.md` (repetir 7.2 e 7.3), testar
  restauração de backup.

## Saída (tudo provado)
- [ ] Sistema no ar; versão servida = último commit da `main` (provado)
- [ ] Usuário percorreu a jornada principal no endereço público
- [ ] Monitoramento e keepalive ativos e testados (ou "não se aplica: motivo")
- [ ] Rotina registrada no `NOTAS.md` §8
- [ ] ROADMAP S.2 e S.3 ✅

## Ao concluir
`ESTADO.md`: Etapa 8 ✅; "No ar? sim (conferido como: …)"; acrescente abaixo
da Trilha a linha **"Projeto EM OPERAÇÃO desde AAAA-MM-DD"**; PRÓXIMO PASSO =
1º item da Fase 2 do ROADMAP (ou "aguardando novas ideias"). Commit + push.

**Daqui em diante:** cada item novo segue o ciclo da Etapa 6; antes de cada
nova publicação, repassar o gate da Etapa 7 no que a mudança tocar; publicar
sempre com aprovação (8.4) e conferência (8.5).

---

## Modelo: `.github/workflows/keepalive.yml`

```yaml
name: keepalive-banco
on:
  schedule: [{ cron: "17 6 * * 1,4" }]   # seg e qui, 06:17 UTC
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS "${{ secrets.URL_HEALTH_DB }}"
```
