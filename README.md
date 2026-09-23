# Kevelyn & Lucas — jantar de noivado

Site em React + Vite para 30/10/2026 às 19h (America/Sao_Paulo), com catálogo de 32 presentes, RSVP e painel administrativo. Visual reconstruído a partir da arte fornecida, usando HTML/CSS e recortes individuais; a arte inteira não é usada como página ou fundo.

## Situação da entrega

- Front-end, imagens, catálogo, integração Supabase, SQL com RLS, testes locais e publicação GitHub Pages preparados.
- Enquanto não houver um projeto Supabase configurado, o site exibe o catálogo e as informações do evento, mas **não aceita reservas nem confirmações**. A interface informa isso e nunca simula gravação bem-sucedida.
- O login e os fluxos completos em produção precisam ser validados após a ativação do Supabase. Consulte `docs/VALIDACAO.md`.

## Executar no computador

Requisito: Node.js 22 ou superior.

```sh
npm ci
cp .env.example .env
npm run dev
```

No Windows, copie `.env.example` para `.env` no Explorador ou use `Copy-Item .env.example .env`. Preencha apenas URL e chave **pública** do Supabase. Nunca use `service_role`, senha ou chave secreta em variáveis `VITE_`, no repositório ou no navegador.

```sh
npm test
npm run build
npm run preview
```

## Configurar o Supabase

1. Entre no [Supabase](https://supabase.com/dashboard), crie uma organização no plano gratuito e um projeto. Escolha São Paulo se disponível. A senha do banco é definida por você e guardada fora deste repositório.
2. No SQL Editor, execute `supabase/001_schema.sql` **uma vez**. Depois execute `supabase/002_gifts.sql`. O segundo arquivo pode ser reexecutado para atualizar títulos/imagens sem remover reservas.
3. Em Authentication → Users, crie o usuário administrador com seu e-mail e uma senha forte. Não coloque essa senha no código. Copie o UUID do usuário.
4. No SQL Editor, substitua o UUID abaixo pelo UUID real do administrador e execute:

```sql
insert into private.admin_users(user_id)
values ('UUID-REAL-DO-USUARIO')
on conflict do nothing;
```

5. Em Authentication, desative a criação pública de usuários (Allow new users to sign up). O site só usa login de administradores; convidados não precisam de conta. Contas autenticadas sem inclusão em `private.admin_users` não podem ler respostas nem reservas privadas.
6. Em Settings → API / API Keys, copie a URL do projeto e a chave pública `publishable` ou `anon` para `.env`. **Não copie a chave secret/service_role.**
7. Para publicar, configure as mesmas duas variáveis em GitHub → repositório → Settings → Secrets and variables → Actions → Variables: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A chave pública pode aparecer no bundle; RLS e os privilégios do banco protegem os dados.
8. Execute novamente o workflow de publicação. Faça os testes reais descritos em `docs/VALIDACAO.md` antes de enviar o site aos convidados.

## Painel administrativo

Acesse o endereço do site com `#/admin` no final. Exemplo: `https://galileu93.github.io/kevelyn-lucas-noivado/#/admin`.

Use o e-mail e a senha do usuário criado no Supabase e autorizado na tabela privada. O painel não aparece na navegação dos convidados. Exibe respostas, pessoas confirmadas, pessoas ausentes, reservas, identidade de quem escolheu e exportações CSV. Para desfazer uma reserva, clique em **Liberar** e confirme na janela. Isso remove o registro daquela reserva e disponibiliza o presente novamente.

## GitHub Pages

Em Settings → Pages, selecione **GitHub Actions** como Source. O workflow `.github/workflows/deploy.yml` instala dependências com lockfile, executa os testes, gera `dist` e publica. A rota administrativa usa hash e os arquivos usam caminhos relativos, evitando 404 em subdiretórios de GitHub Pages. Não é necessário comprar domínio.

## Dados e proteção contra duplicidade

- `gifts`: catálogo público e status; não contém identidade de convidados.
- `gift_claims`: dados privados da reserva, apenas administradores podem consultar.
- `rsvps`: dados privados de presença, apenas administradores podem consultar.
- `private.admin_users`: lista de administradores fora do schema público.
- `reserve_gift`: transação com bloqueio de linha (`FOR UPDATE`), chave única em `gift_id` e request ID para repetição segura. A reserva e o status mudam juntos; a segunda tentativa recebe `already_claimed`.
- `submit_rsvp`: valida os campos e usa request ID único para evitar repetição acidental no mesmo navegador. Não impede uma pessoa de enviar em outros dispositivos. Para corrigir uma resposta já enviada, o organizador deve editar no Supabase; o site não oferece edição pública.
- `release_gift`: exige administrador e usa o mesmo bloqueio transacional.
- Sem armazenamento local dos dados pessoais dos convidados. O navegador guarda apenas identificadores aleatórios de tentativas e a sessão de autenticação administrativa padrão do Supabase.

O catálogo atualiza ao abrir a página, voltar à aba e a cada 15 segundos. Uma reserva feita na própria página aparece imediatamente. Nenhuma decisão de exclusividade depende do front-end. Os formulários públicos não usam CAPTCHA nem limitação por IP; o projeto não promete resistência a spam automatizado. Caso seja necessário, adicione proteção no servidor antes de divulgar amplamente.

## Conteúdo e imagens

`docs/PRODUTOS.md` lista os 32 itens com os links originais e resultado da importação. Os nomes e as imagens vêm dos metadados oficiais dos redirecionamentos do TikTok. A página de compra exigiu autenticação; preço, variações, disponibilidade de estoque e entrega não foram verificados. Fotos de anúncios podem conter preços impressos que não representam cotação atual.

Os arquivos `public/assets/couple.webp`, `hero.webp`, `hero-desktop.webp`, `flowers.webp`, `candles.webp` e `wish.webp` são recortes provisórios da arte fornecida. Nenhuma foto do casal foi inventada. Troque esses arquivos por fotos originais em alta resolução mantendo os nomes, para melhorar a nitidez. Os produtos usam arquivos WebP nomeados pelos respectivos IDs.

O mapa faz uma busca pelo endereço fornecido em Rio de Janeiro/RJ; o pino exato do Espaço MP ainda deve ser conferido pelo organizador. A data usa o deslocamento -03:00, correspondente ao evento em São Paulo/Rio.

## Estrutura

```text
src/main.jsx       Página do evento e navegação por hash
src/forms.jsx      RSVP, catálogo e janela de reserva
src/Admin.jsx      Login e painel administrativo
src/api.js         Supabase, consulta pública, CSV e idempotência
src/products.json  Catálogo importado
src/style.css      Layout responsivo e identidade visual
public/assets/    Fotos, elementos botânicos e produtos
supabase/         Estrutura SQL, funções, RLS e catálogo inicial
tests/            Verificação de regras com PostgreSQL/PGlite
docs/             Importação e relatório de validação
```

Documentação de referência: [RLS do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) e [workflows do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
