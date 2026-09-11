# Lições universais (herdadas do FOPAG-IA)

> Destiladas de ~100 linhas da tabela "Erros já enfrentados" do FOPAG-IA
> (jun–set/2026). Aqui ficam só as que valem em **qualquer** projeto. Cada
> uma tem o caso real (1 frase) e a regra. Lição específica do projeto novo
> vai no `NOTAS.md` §6, não aqui.
>
> Estas lições só servem se forem lidas **na hora de escrever o código**.
> No FOPAG uma lição já registrada (partition pruning) foi esquecida num
> script novo semanas depois.

---

## Processo e documentação

1. **Um fato, um lugar.** *Caso:* o estado vivia em 5 documentos e itens
   "pendentes" já estavam feitos. *Regra:* cada informação tem um dono; os
   outros apontam.
2. **O arquivo carregado toda sessão precisa ser curto.** *Caso:* CLAUDE.md
   com 183 KB, 84% diário. *Regra:* regras no CLAUDE.md, estado no
   ESTADO.md com teto, histórico no git.
3. **Prática que não vira script versionado + regra escrita evapora.**
   *Caso:* o teste ponta a ponta morava no scratchpad e sumiu quando o foco
   mudou. *Regra:* se é importante repetir, é script em `scripts/` e item
   da definição de pronto.
4. **Segurança e qualidade são passo do ritual, não evento.** *Caso:* RLS
   "ligado em tudo" num dia; as tabelas criadas depois nasceram abertas.
   *Regra:* a verificação entra no checklist de toda entrega.
5. **Plano escrito antes de codar, em frente grande.** O plano ancorado no
   código real achou problemas de desenho antes de virarem código (ex.: a IA
   gerava Python, mas o executor consumia JSON).
6. **Regra dos Dois Erros.** Duas falhas no mesmo bug → parar e pedir
   direção. A terceira tentativa sozinha é quase sempre loop caro.
7. **Quando três heurísticas falham, o erro está na premissa.** *Caso:*
   três tentativas de juntar texto de PDF; bastava abrir o stream bruto e
   ver que eram coordenadas, não linhas.
8. **Quando a lista de exceções não fecha, inverta o padrão.** *Caso:*
   ampliar a lista de gatilhos do RAG nunca cobria tudo; consultar por
   padrão e só pular saudação resolveu.
9. **"A ferramenta não está instalada" não é "o dado é inacessível".**
   *Caso:* o agente ia inventar critérios porque achava que não conseguia
   ler a lei; o PDF tinha texto e deu pra ler com Python puro.
10. **Afirmação sobre estado exige conferência.** *Caso:* "tudo commitado e
    pushado" dito sem olhar o remoto; 10 commits estavam só na máquina e o
    dono perdeu uma sessão procurando tela que não estava no ar.
11. **Divergência entre duas fontes é bloqueio.** Se dois lugares discordam
    sobre a mesma regra, um está errado. "Registrei a divergência" não
    resolve.
12. **`TODO`, `_dev` e "provisório" em produção são dívida com prazo.**
    *Caso:* token de reset devolvido na resposta "só em dev" ficou semanas
    exploitável.
13. **Ferramenta destrutiva com whitelist condena o item novo.** *Caso:* o
    cliente entregue para avaliação quase foi apagado porque nasceu depois
    da lista. *Regra:* dry-run conferido item a item e "entra na lista no
    mesmo dia em que é criado".
14. **Não amarre docs ao ambiente.** *Caso:* caminhos de Codespace
    hardcoded quebraram na migração pra WSL. *Regra:* scripts calculam a
    raiz; docs não citam máquina.

## Testes

15. **Bateria verde não prova regra de negócio.** Só a comparação com a
    fonte (lei, spec, dado real) prova. Ver `.kit/etapas/6-construcao.md`.
16. **Recurso multi-tenant precisa de teste multi-tenant.** Um tenant prova
    o fluxo; dois tenants idênticos provam o isolamento.
17. **Skip silencioso esconde regressão.** Total de OK que diminui é falha,
    mesmo com zero FAIL.
18. **Default silencioso mente com cara de resultado.** `get(k, 0)`,
    `except: return 0`: se ninguém escreve a chave, ninguém percebe.
19. **Teste de autorização prova o motivo da falha.** *Caso:* o teste de
    segregação de funções passava porque o usuário levava 403 de perfil, e
    o guard nunca era exercido.
20. **Substituição mecânica em N telas muda o contrato.** *Caso:* um
    componente único trocou 24 selects e escondia dois contratos diferentes
    (por pessoa × por vínculo). *Regra:* perguntar "todas querem a mesma
    regra?" antes de espalhar.
21. **Mapeamento por semelhança de nome precisa de prova numérica.** *Caso:*
    evento "FERIAS" mapeado para "1/3 de férias"; a razão contra a base
    desmentiu em 30 segundos.
22. **Medição com gabarito não verificado mede o gabarito.**

## Banco e dados

23. **Schema real antes de query; nome de tabela é pista, não prova.**
    *Caso:* tabela `esocial_eventos` era classificação de rubricas; os
    eventos moravam em outra.
24. **Correção de padrão exige varredura repo-wide.** *Caso:* o bug de
    "JSONB volta como string" foi corrigido num endpoint e reapareceu em
    outro seis semanas depois.
25. **Otimização que quebra 1 operação em N chamadas precisa declarar o que
    acontece se morrer no meio.** *Caso:* flush em lote sem transação
    deixava buraco que o "retomar" tomava como pronto.
26. **Mexer num guarda-corpo acidental exige auditar quem dependia dele.**
    *Caso:* liberar um self-loop numa trigger removeu a única barreira
    contra dois cálculos simultâneos.
27. **Função "pura" chamada 2× pode mutar o argumento.** *Caso:* o motor
    zerava metade do contexto; a 2ª passada pagaria em dobro.
28. **Regra que mora no banco precisa de tradutor no endpoint.** *Caso:* a
    trigger já tinha a mensagem pronta pro usuário e o endpoint devolvia
    500.
29. **Identificador "fixo" de seed colide entre tenants.** Derive do id do
    tenant.
30. **Fallback de dois degraus esconde o do meio.** Específico → global
    pula o nível intermediário; e o global costuma ser compartilhado entre
    tenants.

## Segurança

31. **Prove pelo caminho do atacante.** Consulta como dono sempre passa; a
    prova é a chamada anônima ou de outro tenant.
32. **Secret vazado no git continua vivo até ser rotacionado.** Repo
    privado reduz o alcance, não neutraliza.
33. **A máscara de log tem que cobrir todos os loggers.** *Caso:* CPF e
    token saíam no log de acesso do servidor web, que não passava pelo
    filtro da aplicação.
34. **Endpoint agregado vaza tão fácil quanto listagem.** *Caso:* painel de
    contagem sem filtro de tenant mostrava números de todos.
35. **Auditoria de segurança é recorrente.** Rota criada antes da última
    auditoria passou 6 semanas sem autenticação.

## Frontend

36. **Estado de UI com uma fonte da verdade.** *Caso:* tema claro/escuro em
    3 lugares gerava texto branco sobre branco. *Regra:* uma fonte, o resto
    deriva.
37. **Form de edição nunca nasce por cópia do de criação.** Cópias divergem
    (15 campos contra 24).
38. **Cache do cliente precisa conhecer a identidade.** *Caso:* cache sem
    token na chave mostrava dado de outra matrícula depois de trocar de
    login.
39. **Erro de API passa por um helper.** Erro de validação chega como array
    de objetos e derruba a tela se renderizado cru.
40. **Header novo no front = CORS no mesmo commit.** Produção de mesma
    origem e testes com curl nunca pegam isso.

## Deploy e ambiente

41. **"Commitado" ≠ "publicado".** Conferir ahead/behind e a versão servida
    (ex.: contar rotas no `openapi.json`). Health 200 responde na versão
    antiga também.
42. **Processo velho engana.** Servidor sem reload não conhece arquivo novo;
    `$!` depois de `&&` pega o PID errado. Confirmar com `ps` depois de
    reiniciar.
43. **`pkill -f padrão` casa com o próprio comando.** Use `padra[o]`.
44. **Banco em plano gratuito pausa; com deploy apontando pra ele, isso é
    incidente de produção.** Monitoração precisa checar o banco, não só o
    processo.
45. **Paralelismo interno disputa núcleo consigo mesmo.** *Caso:* OCR a 75
    s/página caiu para 1,8 s com `OMP_THREAD_LIMIT=1`.

## IA / agentes

46. **Revisor de outro fornecedor pega o que o autor não vê.** As
    reprovações do Codex no FOPAG eram todas procedentes.
47. **IA nunca escreve SQL livre contra dado real.** Use uma whitelist de
    consultas parametrizadas e escopadas pela sessão.
48. **IA gera formato validado, não código.** O portal low-code gera JSON
    que passa pelo mesmo validador do sistema.
49. **Guardrail implementado e não chamado não existe.** *Caso:*
    `responder_com_guardrail()` existia e nenhuma rota o usava.
50. **Premissa assumida por agente é marcada como assumida** e sobe para
    decisão humana, em vez de virar fato no código.
