# GymNotes — análise e validação

## Resumo executivo

O GymNotes é composto por um frontend Next.js/React e uma API Spring Boot, persistindo em PostgreSQL via JPA/Flyway. O frontend e a API estão publicados separadamente na Vercel; a configuração de produção da API usa o Neon. A API publica 16 operações REST e também configura notificações por WebSocket/STOMP.

| Verificação | Resultado |
|---|---:|
| ESLint do frontend (`npm run lint`) | PASSOU |
| Build de produção do frontend (`npm run build`) | PASSOU |
| Testes unitários do backend, Java 25 (`mvn -B clean test`) | 5 passaram; 0 falharam |
| Smoke tests contra os endereços publicados (`npm run test:live-smoke`) | 26 passaram; 0 falharam |
| OpenAPI na primeira chamada após deploy novo | HTTP 200 em 2,98 s |
| Testes que criam dados no Neon | Não executados; nenhum dado foi gravado |

**Estado atual:** frontend e API respondem sem sessão Vercel; OpenAPI anuncia HTTPS e recursos PWA são servidos corretamente. A API foi publicada novamente em `dpl_HQ6JEspT11vzPNTKbF1wYW26iVFw` e o alias `gymnotes-api.vercel.app` respondeu à primeira chamada em 2,98 s, sem o erro de timeout de inicialização observado antes.

## Análise do sistema

### Arquitetura e funcionalidades

- **Frontend:** Next.js 16, React 19 e TypeScript; telas de login/cadastro, treino, nutrição e feed. A navegação do dashboard é protegida por token local. Ver [rotas](./frontend/src/app), [hooks](./frontend/src/hooks) e [cliente HTTP](./frontend/src/services/api.ts).
- **Backend:** Spring Boot 3.5.16 em Java 25; REST, Spring Security/JWT, JPA e PostgreSQL. Flyway mantém três migrações para usuários, relações sociais, treinos, catálogo de exercícios, refeições, catálogo de alimentos e interações.
- **Treinos:** catálogo de exercícios, criação/listagem de fichas, sessões com séries, histórico e progresso por exercício.
- **Nutrição:** busca e cadastro de alimentos, registro de refeições e resumo diário de calorias/macros.
- **Social:** solicitações/respostas de amizade, feed, curtidas e comentários. O backend envia notificações STOMP/WebSocket.
- **Deploy:** frontend e API em projetos Vercel separados; PostgreSQL de produção no Neon. O teste não escreveu no banco.

### Pontos encontrados

1. **Acesso público bloqueado na Vercel — corrigido.** A proteção “Require Log In” foi desativada no projeto do site; o smoke test anônimo agora recebe o conteúdo do GymNotes, manifest e ícones.
2. **Cold start excedia o limite da Vercel — corrigido e medido.** Os logs mostraram o container encerrado antes de abrir a porta porque o Spring Boot levava cerca de 29,5 s frente ao limite de 28,6 s. A configuração de produção agora usa inicialização lazy, a JVM usa `-XX:TieredStopAtLevel=1` e o starter Redis sem uso foi removido. Na implantação nova, a primeira requisição OpenAPI respondeu HTTP 200 em 2,98 s; a suíte subsequente passou sem erro de inicialização.
3. **OpenAPI anunciava HTTP — corrigido.** A URL pública é configurável e, em produção, `/v3/api-docs` anuncia `https://gymnotes-api.vercel.app`.
4. **Timeout do cliente menor que o cold start anterior — corrigido.** O Axios usa timeout de 45 s em [api.ts](./frontend/src/services/api.ts); o login inválido retorna HTTP 401 e as mensagens esperadas, sem erro de rede.
5. **Cobertura automatizada funcional ainda pequena.** O backend tem somente cinco testes unitários em três classes ([testes existentes](./backend/src/test/java)); não há testes de integração com PostgreSQL/Flyway nem suíte frontend.
6. **Fluxos incompletos na interface/API.** Há APIs para perfil/metas, cadastro de alimentos e resposta a amizade, mas não há telas correspondentes no frontend. Não há endpoint para listar amizades/solicitações recebidas, fluxo de logout visível ou cliente STOMP para consumir notificações. O backend emite refresh tokens e o frontend os armazena, mas não há rota de renovação nem interceptor de refresh; um `401` limpa a sessão. Os atalhos do [manifest PWA](./frontend/public/manifest.json) apontam para `/workouts/active` e `/nutrition/log`, rotas que não aparecem entre as páginas atuais.
7. **WebSocket merece revisão de autorização.** O endpoint `/ws` permite qualquer origem e é público na configuração HTTP; não foi encontrado controle de autorização por destino STOMP. Antes de usar notificações com dados reais, validar autenticação e isolamento das mensagens.

## Resultados dos testes executados

### Local

| Comando | Resultado | Observações |
|---|---|---|
| `frontend: npm run lint` | PASSOU | ESLint terminou sem erros. |
| `frontend: npm run build` | PASSOU | Compilação, TypeScript e geração de páginas concluídos. |
| `backend: mvn -B clean test` com Temurin 25.0.5 | PASSOU | 5 testes, 0 falhas, 0 erros, 0 ignorados. Há avisos do Mockito sobre carregamento dinâmico de agente e um aviso de API depreciada em `SecurityConfig`. |

### Produção — smoke tests sem escrita

Executado por `frontend: npm run test:live-smoke`. O teste pode ser repetido com as variáveis opcionais `GYMNOTES_WEB_URL` e `GYMNOTES_API_URL`.

| Caso | Esperado | Resultado observado |
|---|---|---|
| Página `/login` acessível sem sessão Vercel | HTML do GymNotes | **PASSOU:** página pública acessível. |
| OpenAPI lista as rotas | 16 operações | **PASSOU:** 16 operações; resposta HTTP 200. |
| URL do servidor OpenAPI | HTTPS | **PASSOU:** `https://gymnotes-api.vercel.app`. |
| Login com usuário inexistente | HTTP 401 | **PASSOU:** HTTP 401. |
| Cadastro com campos inválidos | HTTP 400 e erros de validação | **PASSOU:** HTTP 400, sem criar usuário. |
| Preflight CORS do domínio do frontend | HTTP 200 e origem correta | **PASSOU:** HTTP 200 para `https://gymnotes-gg.vercel.app`. |
| 16 operações protegidas, sem JWT | HTTP 401 em todas | **PASSOU:** 16/16 retornaram 401. |
| Manifest PWA | JSON | **PASSOU:** servido como JSON. |
| Ícones PWA de 192 e 512 px | PNG | **PASSOU:** ambos servidos como PNG. |
| Primeira chamada após nova implantação | HTTP 200 sem timeout de startup | **PASSOU:** OpenAPI HTTP 200 em 2,98 s. |

**Resultado consolidado:** 26 testes passaram, 0 falharam. A chamada OpenAPI foi feita como primeira requisição após a nova implantação da API; o smoke completo também passou depois dela.

**Limite de escopo:** testes autenticados de criação/alteração não foram executados porque não havia banco de teste nem estratégia segura de limpeza. Nenhum dado foi gravado no Neon. Os 401 comprovam a proteção das rotas, não o sucesso dos fluxos após autenticação.

## Roteiro completo de testes

Executar os fluxos de escrita em ambiente de teste isolado com PostgreSQL/Flyway e duas contas descartáveis. Se for inevitável usar produção, definir antes uma estratégia explícita de limpeza por IDs exclusivos e confirmar a remoção ao final. Não usar contas nem senhas reais.

| ID | Área | Procedimento e resultado esperado | Situação |
|---|---|---|---|
| WEB-01 | Deploy | Abrir o domínio numa sessão anônima; ver o login do GymNotes, sem tela de autenticação da Vercel. | **Passou** |
| WEB-02 | Navegação protegida | Abrir `/workouts`, `/nutrition` e `/feed` sem token; redirecionar para `/login`. | Pendente |
| WEB-03 | Navegação autenticada | Com sessão válida, alternar entre Treinos, Nutrição e Feed em desktop e mobile. | Pendente |
| AUTH-01 | Cadastro | Cadastrar nome/e-mail/senha válidos; criar conta uma vez, receber tokens e abrir Treinos. | Requer banco de teste |
| AUTH-02 | Validação | Enviar nome vazio/curto, e-mail inválido e senha menor que 6; receber validação 400 e não persistir. | **Validação inválida passou** |
| AUTH-03 | Duplicidade | Repetir cadastro com o mesmo e-mail; rejeitar sem duplicar usuário. | Requer banco de teste |
| AUTH-04 | Login | Login válido abre o dashboard e mantém o token após recarregar; credencial inválida retorna 401 com mensagem clara. | **Negativo passou após aquecimento** |
| AUTH-05 | Expiração | Usar token expirado/inválido; limpar sessão e redirecionar ao login, sem loop. | Pendente |
| AUTH-06 | Logout | Encerrar a sessão e verificar limpeza de token e cache local. | Pendente; ação não localizada na interface |
| PROFILE-01 | Perfil | Consultar `/users/me`, alterar nome, bio e foto; recarregar e verificar persistência. | Requer banco de teste |
| PROFILE-02 | Metas | Definir metas positivas de calorias/proteína; rejeitar zero/negativas e validar a atualização do resumo. | Requer banco de teste |
| WORK-01 | Exercícios | Pesquisar termo, termo acentuado, consulta vazia e páginas diferentes; conferir catálogo e paginação. | Rota protegida; leitura autenticada pendente |
| WORK-02 | Fichas | Criar ficha, listar e confirmar persistência; garantir que outro usuário não veja/associe a ficha. | Requer banco de teste |
| WORK-03 | Séries | Criar sessão com várias séries, pesos, repetições, RPE e aquecimento; verificar retorno e histórico. | Requer banco de teste |
| WORK-04 | Histórico | Criar duas sessões com datas distintas; verificar ordem decrescente e dados após recarga. | Requer banco de teste |
| WORK-05 | Progresso | Registrar cargas distintas do mesmo exercício; conferir carga máxima, repetições e volume por sessão. | Requer banco de teste |
| WORK-06 | Validação | Rejeitar sessão sem séries, título vazio, exercício inexistente e valores fora dos limites. | Requer banco de teste |
| NUT-01 | Catálogo | Buscar alimentos por nome/marca, inclusive acentos; verificar paginação e resultado vazio. | Rota protegida; leitura autenticada pendente |
| NUT-02 | Alimentos | Cadastrar alimento válido; conferir arredondamento por 100 g e persistência. | Requer banco de teste |
| NUT-03 | Refeições | Registrar cada tipo de refeição com quantidades conhecidas; validar cálculo proporcional de kcal e macros. | Requer banco de teste |
| NUT-04 | Resumo diário | Conferir soma das refeições, metas/restantes, dia vazio, data explícita e virada UTC. | Requer banco de teste |
| NUT-05 | Validação | Rejeitar refeição sem itens, quantidade não positiva e alimento inexistente. | Requer banco de teste |
| SOCIAL-01 | Amizades | Solicitar amizade entre duas contas; verificar auto-solicitação, duplicata pendente, rejeição e reenvio. | Requer banco de teste |
| SOCIAL-02 | Resposta | Aceitar/recusar como destinatário; outro usuário não pode responder; resposta repetida deve falhar. | Requer banco de teste |
| SOCIAL-03 | Feed | Conferir atividades próprias e de amigos aceitos, ordem, privacidade e ausência de atividade de não amigo. | Requer banco de teste |
| SOCIAL-04 | Paginação | Misturar treinos/refeições com datas diferentes; validar ordenação global e páginas sem duplicatas. | Requer banco de teste |
| SOCIAL-05 | Curtidas | Curtir, verificar contador/estado e repetir para descurtir; não duplicar interação. | Requer banco de teste |
| SOCIAL-06 | Comentários | Comentar em treino/refeição; verificar texto e contagem; rejeitar comentário vazio e limite excedido. | Requer banco de teste |
| SOCIAL-07 | Notificações | Validar autenticação, destinatário, origem e isolamento das notificações STOMP. | Revisão pendente |
| API-01 | Autorização | Sem token, todas as 16 rotas de dados devem retornar 401. | **Passou 16/16** |
| API-02 | CORS | Preflight e chamadas do domínio público; origem permitida correta e origem não autorizada bloqueada. | **Preflight passou**; origem não autorizada pendente |
| API-03 | OpenAPI | Verificar cobertura de operações, autenticação JWT e URL HTTPS executável em navegador. | **Passou: 16 rotas e URL HTTPS** |
| PWA-01 | Recursos | Buscar manifest e ícones; verificar MIME, assinatura PNG, instalação e início standalone. | **Manifest e ícones passaram; instalação pendente** |
| PWA-02 | Atalhos | Abrir os atalhos do manifest; cada destino deve existir e levar ao fluxo esperado. | Pendente; destinos não encontrados entre as rotas atuais |
| UX-01 | Acessibilidade | Teclado, foco, labels, mensagens de erro, leitor de tela e contraste nas quatro telas. | Pendente |
| UX-02 | Responsividade | Testar login, treino, nutrição e feed em viewport mobile/tablet/desktop, sem overflow. | Pendente |
| OPS-01 | Cold start | Medir primeira requisição depois de inatividade; login/cadastro devem sobreviver ao tempo de inicialização do backend. | **Passou após deploy novo: primeira chamada OpenAPI em 2,98 s; cold start após longa inatividade ainda pendente** |
| DATA-01 | Migrações | Criar banco vazio, executar Flyway V1–V3, conferir constraints/seed e inicializar a aplicação. | Pendente; banco indisponível |
| DATA-02 | Persistência | Reiniciar API e confirmar que perfil, ficha, sessão, refeições e interações continuam consistentes. | Pendente |

## Arquivos para repetir

- Roteiro para executar manualmente pelo navegador: [ROTEIRO_TESTE_MANUAL.md](./ROTEIRO_TESTE_MANUAL.md)
- Smoke tests sem escrita: [frontend/scripts/live-smoke.test.mjs](./frontend/scripts/live-smoke.test.mjs)
- Comando: `cd frontend; npm run test:live-smoke`
- Testes unitários: `cd backend; mvn -B clean test` (requer JDK 25)
- Lint/build: `cd frontend; npm run lint` e `npm run build`
