# Deploy no Render

O `render.yaml` define quatro recursos de staging: frontend Next.js, API Spring Boot, PostgreSQL e Key Value compatível com Redis. Todos usam o plano gratuito para evitar criar recursos pagos sem confirmação.

## Criar o Blueprint

1. Envie para o GitHub um branch que contenha `render.yaml`, o frontend e o backend com as alterações desejadas.
2. No Render Dashboard, selecione **New > Blueprint** e conecte o repositório `GymNotes` e o branch publicado.
3. Revise os quatro recursos que o Blueprint vai criar e confirme a criação. O Render gera `JWT_SECRET` e injeta as referências privadas do Postgres e Key Value.
4. Aguarde o primeiro deploy da API e do frontend. O frontend obtém a origem da API pelo Render e acrescenta `/api/v1`; a API permite a origem publicada do frontend via CORS.

O repositório local precisa estar commitado e enviado ao GitHub para o Render fazer build. Este workspace tem outras alterações locais pendentes; revise-as antes de incluí-las no branch de deploy.

## Limitações do plano gratuito

Este Blueprint é apenas para staging/avaliação. Serviços web gratuitos dormem após inatividade, o Key Value gratuito não persiste dados e o PostgreSQL gratuito expira após 30 dias. Não use esses planos para dados reais ou produção. Antes de promover o app, selecione planos pagos, habilite backups do Postgres e configure persistência do Key Value conforme o uso do app. Isso pode gerar cobrança.

## Configuração da aplicação

A API usa o perfil `prod`; o Render fornece Postgres, Key Value e um segredo JWT gerado. O banco e o cache ficam sem acesso externo. `CORS_ALLOWED_ORIGINS` e `NEXT_PUBLIC_API_URL` apontam para as URLs geradas do frontend e da API, sem URLs hard-coded no Blueprint.
