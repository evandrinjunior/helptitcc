# HelpTI — Front-end (HTML/CSS/JS puro + Firebase)

Sistema de chamados que conecta **clientes** com problemas de hardware/software a **técnicos** que assumem e negociam a solução em um chat interno.

## Duas versões no projeto

- **Raiz (`login.html`, `cadastro.html`, `feed.html`, `chat.html`)** → versão real, conectada ao Firebase. É a que vai pra produção, mas exige configurar `js/firebase-config.js`.
- **`local/`** → versão que funciona **sem nenhum banco de dados externo**, usando o `localStorage` do navegador no lugar do Firebase. Serve pra você testar o fluxo completo (cadastro → login → publicar chamado → assumir → chat) e ir mexendo no visual/comportamento sem precisar configurar nada antes. Veja a seção "Versão local" abaixo.

## Estrutura de arquivos

```
helpti/
├── login.html / cadastro.html / feed.html / chat.html   → versão Firebase
├── css/style.css                                          → estilos (compartilhado pelas duas versões)
├── js/
│   ├── firebase-config.js  ← COLE SUAS CHAVES AQUI
│   ├── auth.js / demandas.js / chat.js
└── local/                                                   → versão sem banco de dados
    ├── login.html / cadastro.html / feed.html / chat.html
    └── js/local-db.js       ← "banco" fake usando localStorage
```

## Versão local (sem banco de dados) — para testar agora

1. Abra a pasta `helpti` inteira no VS Code.
2. Clique com o botão direito em `local/login.html` → **"Open with Live Server"**.
3. Crie uma conta pela tela de cadastro (ou, no console do navegador — F12 —, digite `helptiSeed()` na tela de login para gerar 2 contas de teste + 1 chamado já em negociação: `tecnico@teste.com` e `cliente@teste.com`, senha `123456`).
4. Para testar o chat dos dois lados ao mesmo tempo, abra **duas abas**: uma logada como cliente, outra como técnico. Elas se atualizam sozinhas (o `local-db.js` escuta mudanças entre abas).

Tudo fica salvo no `localStorage` do navegador (por origem/domínio). Para zerar os dados, abra o console (F12) e rode `localStorage.clear()`.

Quando estiver satisfeito com o comportamento e visual, é só repetir os mesmos ajustes nos arquivos da raiz (versão Firebase) — a lógica e os nomes dos campos são os mesmos, só troca de onde os dados são lidos/escritos.

## Passo a passo para ativar o Firebase (versão da raiz)

1. Acesse https://console.firebase.google.com e crie um projeto.
2. **Authentication** → aba "Sign-in method" → ative **E-mail/senha**.
3. **Firestore Database** → criar banco → modo produção (as regras abaixo cuidam da segurança).
4. **Configurações do projeto** → "Seus apps" → clique no ícone Web (`</>`) → registre o app.
5. Copie o objeto `firebaseConfig` que aparece e cole em `js/firebase-config.js`, substituindo os placeholders.
6. Rode um servidor local na pasta (obrigatório por causa dos `import` de módulos ES / CORS):
   ```bash
   npx serve .
   # ou
   python3 -m http.server 8080
   ```
7. Abra `http://localhost:8080/cadastro.html` e crie o primeiro usuário.

## Modelo de dados (Firestore) — padronizado

**`usuarios/{uid}`**
| campo | tipo | descrição |
|---|---|---|
| nome | string | nome do usuário |
| email | string | e-mail de login |
| tipo | "cliente" \| "tecnico" | define a visão do sistema |
| criadoEm | timestamp | data de cadastro |

**`demandas/{demandaId}`** (documento gerado automaticamente pelo Firestore)
| campo | tipo | descrição |
|---|---|---|
| ticketId | string | ID visual sequencial, ex: `HT-2026-0001` |
| titulo | string | título do chamado |
| descricao | string | descrição do problema |
| categoria | "hardware" \| "software" | |
| status | "aberto" \| "em_negociacao" \| "resolvido" \| "cancelado" | |
| clienteId / clienteNome | string | quem publicou |
| tecnicoId / tecnicoNome | string \| null | quem assumiu (null até alguém assumir) |
| criadoEm / atualizadoEm | timestamp | |

**`demandas/{demandaId}/mensagens/{mensagemId}`** (subcoleção)
| campo | tipo | descrição |
|---|---|---|
| remetenteId | string | uid de quem enviou |
| remetenteNome | string | |
| texto | string | conteúdo da mensagem |
| criadoEm | timestamp | |

## Regras de segurança do Firestore (sugestão inicial)

Cole em **Firestore Database → Regras**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /usuarios/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && request.auth.uid == uid;
    }

    match /demandas/{demandaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.clienteId == request.auth.uid;
      allow update: if request.auth != null; // refine depois: só cliente/técnico do chamado

      match /mensagens/{msgId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null
                      && request.resource.data.remetenteId == request.auth.uid;
      }
    }
  }
}
```

> Essas regras são um ponto de partida seguro para o TCC. Antes de publicar em produção real, vale restringir `update` em `demandas` para aceitar apenas o cliente dono ou o técnico responsável.

## Fluxo do sistema

1. Usuário se cadastra escolhendo **cliente** ou **técnico** (`cadastro.html`).
2. Cliente publica um chamado pelo painel no topo do `feed.html` → status `aberto`.
3. Técnico vê chamados `aberto` no mesmo `feed.html` e clica em **Assumir chamado** → status vira `em_negociacao`, o `tecnicoId` é preenchido.
4. Cliente e técnico abrem o **chat** (`chat.html?demanda=ID`) para negociar.
5. O técnico responsável marca o chamado como **resolvido** ou **cancelado** pelo seletor no cabeçalho do chat.

## Próximos passos sugeridos

- Tela de detalhes/perfil do técnico (avaliações, especialidades).
- Upload de imagens do problema (Firebase Storage).
- Notificações quando o chamado muda de status.
- Paginação no quadro de chamados quando o volume crescer.
