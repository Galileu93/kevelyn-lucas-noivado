# Validação — atualização em 24/09/2026

## Publicação e banco
- Site publicado em https://galileu93.github.io/kevelyn-lucas-noivado/ com Supabase real configurado por variáveis do GitHub Actions.
- Projeto Supabase lygqbshsjcikxlvlknzd, região São Paulo. Schema e catálogo de 32 presentes aplicados.
- Usuário administrativo criado pelo proprietário e autorizado com confirmação explícita. Login real verificado no navegador.
- Consultas anônimas a gift_claims e rsvps recusadas com HTTP 401. Catálogo público apresenta apenas os campos de produto/status, sem identidade dos convidados.

## Testes concluídos
- npm test: 8 verificações passaram; npm run build: sucesso.
- Supabase real, transação revertida ao final: primeira reserva aceita, repetição idempotente, segunda reserva rejeitada, respostas de presença sim/não registradas e consultadas pelo papel administrativo, liberação devolvendo status available. Não ficaram respostas artificiais persistidas.
- Duas requisições HTTP simultâneas ao Supabase real para o mesmo presente: respostas already_claimed e reserved. Repetição do pedido vencedor retornou reserved, mantendo uma única reserva exibida no painel.
- Painel autenticado: 31 disponíveis/1 escolhido durante o teste, identidade de teste visível apenas no painel. Catálogo público atualizou para Presente escolhido e desativou o botão sem mostrar a identidade.
- Exportar CSV gerou gifts.csv com 32 produtos e a reserva de teste corretamente identificada. Arquivo conferido no computador.
- Após autorização do usuário, reserva de teste removida pelo botão Liberar do painel. API pública confirmou novamente 32 produtos available.
- Console do painel sem erros/avisos na verificação.
- Layout revisado em 320, 360, 375, 390, 430, 768, 1024, 1366 e 1440 pixels; sem transbordamento horizontal. Título ajustado em 320 pixels.
- Contador usa 2026-10-30T19:00:00-03:00. Rotas administrativas e assets funcionam no subdiretório do GitHub Pages.
- Catálogo: 32 títulos/fotos obtidos dos metadados oficiais dos links fornecidos; nenhuma identificação inventada.

## Limites da verificação
- Concorrência real foi testada por duas requisições HTTP simultâneas, não por dois cliques humanos em navegadores distintos.
- RSVP sim/não foi testado nas funções reais do banco em transação revertida. O envio completo pela interface pública, login com senha incorreta e logout não foram repetidos nesta etapa.
- Produtos, variantes, voltagem, estoque e entrega devem ser conferidos na loja antes da compra; checkout não foi executado.
- O mapa usa busca pelo endereço informado; o pino exato do Espaço MP não foi confirmado.
- Fotos extraídas da arte de referência têm resolução limitada; originais podem melhorar a qualidade.
