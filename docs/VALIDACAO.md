# Validação — 23/09/2026

## Executado

- `npm test`: 8 verificações aprovadas usando o SQL real em PostgreSQL/PGlite.
- `npm run build`: geração de produção concluída.
- Catálogo: os 32 links originais foram acessados individualmente; 32 títulos e 32 fotografias recuperados dos metadados oficiais de compartilhamento. IDs conferidos e imagens salvas em WebP.
- Navegador: inspeção visual em 375, 390, 430, 768, 1024, 1366 e 1440 pixels. Medições de largura também em 320 e 360 pixels, sem rolagem horizontal de página ou controles fora da tela.
- Janela de presentes: produto correspondente, aviso de cores, campos com labels, fechamento por Escape e bloqueio da finalização quando não há banco configurado.
- RSVP: campos e seleção de ausência verificados. Envio indisponível enquanto o banco não está conectado, com mensagem explícita.
- Contador: números mudam em tempo real; alvo `2026-10-30T19:00:00-03:00`.
- Navegação por âncoras, rotas de administração por hash e caminhos relativos para publicação em subdiretório.
- SQL: acesso público somente ao catálogo, dados privados invisíveis para anônimo e usuário autenticado sem papel administrativo, validação de campos, idempotência do RSVP e da reserva, duas tentativas concorrentes no cliente local, constraint única e liberação administrativa seguida de nova reserva.
- O teste de concorrência local usa um único motor PGlite, que enfileira operações. Confirma as regras e a unicidade, mas **não substitui um teste com duas conexões independentes no Supabase de produção**.
- WebMCP: registro dos dois recursos, consulta do catálogo e rejeição de ID inválido verificados no navegador. A abertura por ferramenta de um presente disponível depende de conexão real; sem banco o estado é desconhecido e a ação é recusada.

## Pendências de ativação — não declarar como testadas em produção

1. Criar o projeto Supabase na conta do organizador e aplicar os dois arquivos SQL.
2. Criar o usuário administrador, autorizar seu UUID e configurar a URL e chave pública.
3. Repetir RSVP sim/não, atualização do painel, login correto/incorreto, logout e exportação CSV usando o Supabase real.
4. Em dois navegadores, abrir o mesmo presente disponível. Confirmar quase simultaneamente: apenas um deve conseguir reservar; o outro deve receber a mensagem de item já escolhido. Verificar uma única linha em `gift_claims`.
5. Liberar essa reserva pelo painel e conferir a disponibilidade pública. Usar registros claramente identificados como teste e removê-los no SQL Editor antes de divulgar.
6. Verificar no TikTok o produto, a variação, a voltagem, o estoque e a entrega. A tela de compra exige login; o acesso ao checkout e a compra não foram executados.
7. Conferir o pino exato do Espaço MP. O link usa a busca pelo endereço e cidade informados, sem inventar coordenadas.

O site não está operacional para receber convidados até concluir as pendências de banco e autenticação. A versão informativa pode ser publicada com botões de envio desativados.
