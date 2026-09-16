# Baião P1 — API Node.js + TypeScript

Projeto criado seguindo a **Aula 01 - Configurando API NODEJS**: ambiente de desenvolvimento
para uma API com Node.js, TypeScript, Express, PostgreSQL e TypeORM.

## Requisitos

- [Node.js](https://nodejs.org/) 22 ou superior (verifique com `node -v`)
- [PostgreSQL](https://www.postgresql.org/download/) instalado e em execução
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado)

## Estrutura

```
src/
  index.ts               -> ponto de entrada: cria o app Express e sobe o servidor
  data-source.ts         -> configuração da conexão TypeORM (lê variáveis de ambiente)
  controllers/
    auth.ts                -> rota de boas-vindas ("/")
    situations.ts           -> CRUD de situações ("/situations")
  entity/
    situations.ts          -> entidade Situations (1 situação -> muitos usuários)
    users.ts               -> entidade Users (muitos usuários -> 1 situação)
  migration/
    *-CreateSituations.ts   -> cria a tabela "situations"
    *-CreateUsers.ts        -> cria a tabela "users" + FK para "situations"
  seeds/
    create-situations-seeds.ts -> dados padrão da tabela "situations"
  services/
    pagination.service.ts   -> serviço genérico de paginação (reutilizável)
  run-seeds.ts           -> executor dos seeds (conecta, roda, encerra a conexão)
sql/
  create_database.sql    -> script para criar o banco "node_api" no PostgreSQL
```

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o banco de dados no PostgreSQL executando `sql/create_database.sql`
   (via `psql -U postgres -h localhost -c "CREATE DATABASE node_api WITH ENCODING 'UTF8';"` ou colando no pgAdmin).
3. Copie `.env.example` para `.env` e preencha com as suas credenciais do PostgreSQL:
   ```bash
   cp .env.example .env
   ```

### Variáveis de ambiente (`.env`)

| Variável       | Descrição                                   | Padrão       |
|----------------|----------------------------------------------|--------------|
| `SERVER_PORT`  | Porta em que a API sobe                       | `8080`       |
| `DB_DIALECT`   | Dialeto do banco (`postgres`, `mysql`, `mariadb`, `mongodb`, ...) | `postgres` |
| `DB_HOST`      | Host do banco de dados                        | `localhost`  |
| `DB_PORT`      | Porta do banco de dados                       | `5432`       |
| `DB_USERNAME`  | Usuário do banco                              | `postgres`   |
| `DB_PASSWORD`  | Senha do usuário do banco                     | —            |
| `DB_DATABASE`  | Nome do banco de dados                        | `node_api`   |

> O arquivo `.env` não deve ser commitado (já está no `.gitignore`). Use o `.env.example`
> como modelo para quem for clonar o projeto.

## Scripts disponíveis

| Comando               | O que faz                                                             |
|-----------------------|------------------------------------------------------------------------|
| `npm run build`       | Compila o TypeScript (`src`) para JavaScript (`dist`)                 |
| `npm start`           | Executa o projeto já compilado (`dist/index.js`)                      |
| `npm run seed`        | Popula o banco com os dados padrão (`dist/run-seeds.js`)              |
| `npm run watch`       | Compila em modo observador, recompilando a cada alteração             |
| `npm run start:watch` | Roda o observador do TypeScript **e** reinicia o servidor automaticamente a cada mudança (usa `concurrently`) |

Durante o desenvolvimento, use:

```bash
npm run start:watch
```

E acesse [http://localhost:8080](http://localhost:8080).

## Migrations

As tabelas do banco são criadas/alteradas via **migrations** do TypeORM (nunca com
`synchronize: true`), para que qualquer pessoa que clonar o projeto consiga recriar o
banco de dados exatamente igual, só rodando um comando.

| Comando | O que faz |
|---|---|
| `npx typeorm migration:create src/migration/NomeDaMigration` | Gera um novo arquivo de migration vazio (`up`/`down`) |
| `npm run build && npx typeorm migration:run -d dist/data-source.js` | Compila e aplica todas as migrations pendentes no banco |
| `npx typeorm migration:revert -d dist/data-source.js` | Desfaz a última migration aplicada (roda o `down`) |
| `npx typeorm query "SELECT table_name FROM information_schema.tables WHERE table_schema='public'" -d dist/data-source.js` | Lista as tabelas existentes (útil pra conferir) |

Migrations já criadas: `CreateSituations` (tabela `situations`) e `CreateUsers` (tabela
`users`, com a chave estrangeira `situation_id` → `situations.id`, `ON DELETE CASCADE`).

## Rotas da API

### Auth (`/`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Rota de boas-vindas (placeholder) |

### Situations (`/situations`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/situations?page=1&limit=10` | Lista as situações **paginadas** (ordenadas por `id` DESC), via `PaginationService`. `limit` padrão: 10. Retorna `error`, `data`, `currentPage`, `lastPage` e `totalRecords` |
| GET | `/situations/view/:id` | Retorna uma situação específica (404 se não existir) |
| POST | `/situations` | Cadastra uma nova situação — body: `{ "name_situation": "ativo" }` (nome precisa ser único) |
| PUT | `/situations/edit/:id` | Atualiza uma situação — body: `{ "name_situation": "inativo" }` (404 se não existir) |
| DELETE | `/situations/delete/:id` | Remove uma situação (404 se não existir) |

> Teste as rotas com o [Postman](https://www.postman.com/) ou `curl`. Lembre-se que o
> `POST` exige o header `Content-Type: application/json`.

## Seeds

Seeds cadastram **dados padrão** no banco, para que quem clonar o projeto já tenha
registros para testar sem precisar adivinhar o que cadastrar.

```bash
npm run build && npm run seed     # ou: node dist/run-seeds.js
```

O seed de `situations` cadastra `ativo`, `inativo` e `pendente`. Ele é **idempotente**:
se a tabela já tiver registros, não faz nada (evita duplicar dados).

Para criar um novo seed: adicione o arquivo em `src/seeds/`, e no `src/run-seeds.ts`
basta instanciar a classe e chamar `.run(AppDataSource)` junto dos demais.

### Ordem de setup do projeto do zero

```bash
npm install                                            # 1. dependências
psql -U postgres -c "CREATE DATABASE node_api ..."     # 2. cria o banco
cp .env.example .env                                   # 3. configura credenciais
npm run build                                          # 4. compila
npx typeorm migration:run -d dist/data-source.js       # 5. cria as tabelas
npm run seed                                           # 6. popula os dados padrão
npm run start:watch                                    # 7. sobe a API
```

## Paginação

A paginação vive em `src/services/pagination.service.ts` e serve **qualquer** repositório
do TypeORM — não precisa reescrever a lógica em cada listagem:

```ts
const result = await PaginationService.paginate(situationRepository, page, limit, {
  id: 'DESC',
});
```

| Parâmetro | Descrição | Padrão |
|---|---|---|
| `repository` | Repositório da entidade a paginar | — |
| `page` | Página solicitada | `1` |
| `limit` | Registros por página | `10` |
| `order` | Ordenação (`FindOptionsOrder`) | `{}` |

Retorna `{ error, data, currentPage, lastPage, totalRecords }`. Se a página pedida não
existir, lança um `Error` com a mensagem do total de páginas — trate no `try/catch` do
controller.

## Próximos passos

CRUD de `Situations` completo (create, list, view, edit, delete) + seeds + paginação
reutilizável. Próximo: aplicar o mesmo padrão ao CRUD da entidade `Users`, incluindo o
relacionamento com `Situations`.
