# GymNotes

## Executar o backend

Requisitos: Docker Desktop instalado e em execução.

Na raiz do projeto, execute:

```powershell
docker compose up --build backend
```

O Compose inicia PostgreSQL e Redis, aguarda os health checks e então constrói
e executa o backend. O Spring Boot aplica as migrações do banco ao iniciar.

- API: <http://localhost:8080>
- Swagger UI: <http://localhost:8080/swagger-ui.html>

Para encerrar os serviços, pressione `Ctrl+C` e execute `docker compose down`.
Os dados do PostgreSQL e Redis permanecem nos volumes do Docker. Para removê-los
deliberadamente, use `docker compose down --volumes`.

As credenciais e o segredo JWT definidos por padrão são apenas para
desenvolvimento local; configure valores próprios antes de qualquer uso em
ambientes compartilhados ou de produção.
