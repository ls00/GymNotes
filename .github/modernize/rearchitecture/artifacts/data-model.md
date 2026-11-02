# GymNotes — Modelo de Dados Atual

> Inventário do esquema presente em Flyway/JPA. Não é uma proposta de redesign; preserve tabelas, colunas, tipos, enum serialization e restrições existentes quando uma feature os utilizar.

## Persistência e migrações

- Banco: PostgreSQL; UUIDs como chaves primárias.
- Migrações: `V1__init_schema.sql` cria as dez tabelas de domínio e índices; `V2__seed_catalog.sql` popula 12 exercícios e 10 alimentos; `V3__add_user_roles.sql` adiciona `users.role` e a restrição de valores.
- JPA/Hibernate está em `ddl-auto: validate`; Flyway valida as migrações. `open-in-view: false`.
- Tabelas e colunas usam `snake_case`; entidades usam `@Table`/`@Column` explicitamente. Enums persistidos como string.

## Entidades e campos

| Entidade / tabela | Campos persistidos (tipo Java → coluna; constraints principais) |
|---|---|
| `User` / `users` | `UUID id` PK; `String name` varchar(150), obrigatório; `String email` varchar(255), obrigatório/único; `String passwordHash` varchar(255), obrigatório; `UserRole role` varchar(30), obrigatório, default `USER`, valores `USER`/`SUPER_ADMIN`; `String profilePictureUrl` varchar(500); `String bio` text; `String targetObjective` varchar(100); `Integer dailyCalorieGoal`; `BigDecimal dailyProteinGoalG` numeric(6,2); `Instant createdAt`, `updatedAt` timestamptz, obrigatórios. `@PrePersist`/`@PreUpdate` atualizam timestamps na aplicação. |
| `Friendship` / `friendships` | `UUID id` PK; `User requester` → `requester_id` FK; `User addressee` → `addressee_id` FK; `FriendshipStatus status` varchar(20), obrigatório, valores `PENDING`/`ACCEPTED`/`REJECTED`; `Instant createdAt` timestamptz. Par ordenado `(requester_id, addressee_id)` único; requester diferente de addressee; remoção de usuário cascata no banco. |
| `WorkoutPlan` / `workout_plans` | `UUID id` PK; `User user` → `user_id` FK obrigatório; `String name` varchar(150), obrigatório; `String description` text; `Boolean isActive` obrigatório, default `true`; `Instant createdAt` timestamptz obrigatório. |
| `Exercise` / `exercises` | `UUID id` PK; `String name` varchar(150), obrigatório; `MuscleGroup muscleGroup` varchar(50), obrigatório; `EquipmentType equipment` varchar(50), opcional; `String description` text. Catálogo seeded na V2. |
| `WorkoutSession` / `workout_sessions` | `UUID id` PK; `User user` → `user_id` FK obrigatório; `WorkoutPlan workoutPlan` → `workout_plan_id` FK opcional; `String title` varchar(150), obrigatório; `String notes` text; `Instant startedAt` obrigatório; `Instant endedAt` opcional; `Boolean isPublic` obrigatório, default `true`; `Instant createdAt` obrigatório. Sessões pertencem a usuário; exclusão de usuário cascata; exclusão de ficha define vínculo como nulo. |
| `WorkoutSet` / `workout_sets` | `UUID id` PK; `WorkoutSession workoutSession` → `workout_session_id` FK obrigatório; `Exercise exercise` → `exercise_id` FK obrigatório; `Integer setOrder`, obrigatório; `Integer reps`, obrigatório e `>= 0`; `BigDecimal weightKg` numeric(6,2), obrigatório e `>= 0`; `BigDecimal rpe` numeric(3,1), opcional e entre 1.0 e 10.0; `Boolean isWarmup` obrigatório, default `false`. |
| `Food` / `foods` | `UUID id` PK; `String name` varchar(150), obrigatório; `String brand` varchar(150); `BigDecimal caloriesPer100g`, `proteinPer100g`, `carbsPer100g`, `fatsPer100g` numeric(6,2), obrigatórios e não negativos; `Boolean isVerified` obrigatório, default `false`. Catálogo seeded na V2. |
| `MealLog` / `meal_logs` | `UUID id` PK; `User user` → `user_id` FK obrigatório; `MealType mealType` varchar(30), obrigatório; `Instant loggedAt` timestamptz obrigatório; `String photoUrl` varchar(500). |
| `MealItem` / `meal_items` | `UUID id` PK; `MealLog mealLog` → `meal_log_id` FK obrigatório; `Food food` → `food_id` FK obrigatório; `BigDecimal quantityG` numeric(7,2), obrigatório e `> 0`. |
| `FeedInteraction` / `feed_interactions` | `UUID id` PK; `User user` → `user_id` FK obrigatório; `WorkoutSession workoutSession` → `workout_session_id` opcional; `MealLog mealLog` → `meal_log_id` opcional; exatamente um dos dois alvos é exigido; `InteractionType type` varchar(20), obrigatório (`LIKE`/`COMMENT`); `String commentText` text; `Instant createdAt` timestamptz obrigatório. Exclusões de usuário/alvo cascata no banco. |

### Relacionamentos JPA

- `Friendship` tem dois `ManyToOne` lazy para `User` (solicitante e destinatário); unicidade é direcional por par de IDs.
- `WorkoutPlan` e `WorkoutSession` têm `ManyToOne` lazy para `User`; sessão também aponta opcionalmente para plano.
- `WorkoutSession` tem `OneToMany` para `WorkoutSet`, `cascade=ALL`, `orphanRemoval=true`, ordenado por `setOrder`.
- `WorkoutSet` aponta para a sessão e para `Exercise` com `ManyToOne` lazy.
- `MealLog` tem `ManyToOne` lazy para `User` e `OneToMany` de `MealItem`, `cascade=ALL`, `orphanRemoval=true`.
- `MealItem` aponta para refeição e alimento com `ManyToOne` lazy.
- `FeedInteraction` tem `ManyToOne` lazy para usuário e, mutuamente exclusivo, sessão ou refeição.
- As relações e ações de `ON DELETE` são definidas no SQL de migração; as coleções JPA não criam associações inversas adicionais em `User`, `Food` ou `Exercise`.

### Restrições e índices do banco

- `users.email` único; índices adicionais para email.
- `friendships`: requester/addressee únicos em conjunto, sem autoamizade, status limitado; índices nos dois lados.
- `workout_sets`: reps/peso não negativos, RPE 1–10; índices por sessão e exercício.
- `foods`: nutrientes por 100g não negativos; índice por nome.
- `meal_items`: quantidade estritamente positiva; índices por meal log e alimento.
- `feed_interactions`: exatamente um alvo workout/meal e tipo limitado; índices por autor e alvos.
- Índices adicionais em fichas por usuário, sessões por usuário/plano/início, alimentos por nome e refeições por usuário/data.

## Transações observadas

Os limites são declarados nos serviços; operações compostas de escrita são atômicas dentro do método anotado:

- `AuthService.register`: `@Transactional`; persiste usuário, gera access/refresh JWT e monta resposta. `login`: read-only.
- `UserService.getCurrentUserProfile`: read-only; `updateProfile`: escrita.
- `WorkoutService.createPlan` e `createSession`: escrita; histórico, catálogo, planos e progresso: read-only. Criar sessão salva a sessão e suas séries no mesmo limite, via cascade.
- `NutritionService.createFood` e `logMeal`: escrita; busca/resumo diário: read-only. Registrar refeição salva o log e itens via cascade.
- `SocialService.sendFriendRequest`, `respondToFriendRequest` e `interact`: escrita; `getFeed`: read-only. Notificações são enviadas ao broker durante esses métodos transacionais; o envio não é uma gravação no banco.

## Entidades-chave

1. `User`: conta, autorização e metas nutricionais.
2. `WorkoutPlan`: ficha de treino do usuário.
3. `Exercise`: catálogo compartilhado usado nas séries.
4. `WorkoutSession`: sessão executada e publicação potencial do feed.
5. `WorkoutSet`: exercício, carga, repetições, ordem e esforço em uma sessão.
6. `Food`: referência nutricional por 100g.
7. `MealLog`: refeição de um usuário e origem de atividade social.
8. `FeedInteraction`: curtida ou comentário em sessão/refeição.
