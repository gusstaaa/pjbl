# 👋 Leia-me primeiro

Este kit faz o **Claude Code** te guiar do zero até o seu sistema no ar,
**passo a passo**, mesmo que você nunca tenha programado. Você decide o que
quer; o Claude executa, testa e te explica cada etapa. Nenhuma etapa é pulada.

Você só faz **3 coisas** antes de o Claude assumir. Depois disso, é conversa.

---

## 1. Instalar o Linux dentro do Windows (WSL) — só uma vez

> Usa Mac ou Linux? Pule para o passo 2 (no Mac, use o app **Terminal**).

1. Clique no menu Iniciar, digite **PowerShell**, clique com o botão direito
   → **Executar como administrador**.
2. Digite `wsl --install` e dê Enter.
3. Reinicie o computador.
4. Abra o app **Ubuntu** (menu Iniciar). Ele pede um **nome de usuário** e uma
   **senha**. Anote essa senha: o Claude vai pedir que você a digite às vezes.
   Enquanto você digita a senha, **nada aparece na tela**. É normal.

## 2. Instalar o Claude Code — só uma vez

Precisa de assinatura **Claude Pro, Max ou Team** (o plano gratuito não
inclui o Claude Code). No Ubuntu, cole o comando abaixo (botão direito do
mouse cola) e dê Enter:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Feche e abra o Ubuntu de novo.

## 3. Abrir o Claude na pasta do kit

1. No Windows, abra a pasta deste kit (a que tem este arquivo).
2. Clique na **barra de endereço** lá em cima, apague o que estiver escrito,
   digite **wsl** e dê Enter. Abre um terminal já dentro da pasta.
3. Digite `claude` e Enter. Na 1ª vez ele abre o navegador para você entrar
   na sua conta e pergunta se confia na pasta: responda **sim**.
4. Digite: **começar**

Pronto. A partir daqui o Claude conduz. Logo na 1ª etapa ele move o projeto
para a pasta certa do Linux e te diz como abrir da próxima vez.

---

## Toda vez que for trabalhar

1. Abra o app **Ubuntu**.
2. Digite `cd ~/projetos/NOME-DA-PASTA` e Enter (o Claude te diz o nome certo).
3. Digite `claude` e Enter.
4. Digite: **continuar**

Para parar, digite **encerrar**: o Claude salva tudo e diz o que vem depois.

## As 8 etapas

1. **Boas-vindas** — nome do projeto e computador pronto
2. **Cofre do código** — seu projeto guardado no GitHub
3. **Requisitos** — o Claude te entrevista: o que vamos construir
4. **Plano** — em que ordem construir
5. **Fundação** — ligar banco e serviços e ver o sistema abrir
6. **Construção** — um pedaço por vez, você testa cada um
7. **Segurança** — antes de qualquer pessoa de fora usar
8. **Publicação** — o sistema no ar e a rotina para mantê-lo vivo

## Regras de ouro para você

- **Nunca cole senha ou chave secreta no chat.** O Claude te mostra onde
  colocar (um arquivo chamado `.env`, que nunca sai do seu computador).
- Às vezes o Claude vai pedir para você abrir uma **janela de apoio** (outra
  janela do Ubuntu) e colar um comando lá. É para coisas que pedem a sua senha
  ou o seu login.
- De vez em quando o Claude Code mostra um pedido de **permissão** ("Do you
  want to…?"). Coisas seguras já vêm liberadas; quando aparecer, leia a frase
  que o Claude escreveu logo antes explicando o que vai fazer. Se fizer
  sentido, escolha **Yes**. Na dúvida, escolha **No** e pergunte a ele.
- Perdido? Digite **onde estamos?**
- Não entendeu? Digite **explica mais simples**.
- Não mexa nas pastas `.kit` e `.claude`: são o "motor" do guia.
- Vá no seu ritmo: o Claude anota onde parou e continua dali.
