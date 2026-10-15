# Baião P1 — API Node.js + TypeScript

API REST desenvolvida com **Node.js, Express, TypeScript, PostgreSQL e TypeORM**, seguindo
o diagrama entidade-relacionamento do Projeto P1.

## Itens da avaliação

| Item | Onde está |
|---|---|
| Configuração da API | `src/index.ts`, `package.json`, `tsconfig.json` |
| Models / Entitys | `src/entity/` (5 entidades — no TypeORM a entity é o model), registradas em `src/data-source.ts` |
| Variáveis de Ambiente | `.env.example` + `dotenv` em `src/index.ts` e `src/data-source.ts` |
| Migrations | `src/migration/` (5 migrations, com FKs e rollback) |
| CRUD | `src/controllers/` — as 5 operações para cada uma das 5 entidades |
| Controllers | `src/controllers/`, registrados em `src/index.ts` |
| Seeds | `src/seeds/` (3 seeds), executados por `src/run-seeds.ts` |
| Services (Pagination) | `src/services/pagination.service.ts`, usado nas 5 listagens |

## Requisitos

- [Node.js](https://nodejs.org/) 22 ou superior (verifique com `node -v`)
- [PostgreSQL](https://www.postgresql.org/download/) instalado e em execução
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado)

## Modelo de dados

```
situations ──1:N──> users
product_categories ──1:N──> products
product_situations ──1:N──> products
```

| Tabela | Colunas |
|---|---|
| `situations` | `id`, `nameSituation` (único), `createdAt`, `updatedAt` |
| `users` | `id`, `name`, `email` (único), `situationId` (FK), `createdAt`, `updatedAt` |
| `product_categories` | `id`, `name` (único), `createdAt`, `updatedAt` |
| `product_situations` | `id`, `name` (único), `createdAt`, `updatedAt` |
| `products` | `id`, `name`, `productSituationId` (FK), `productCategoryId` (FK), `createdAt`, `updatedAt` |

Todas as chaves estrangeiras usam `ON DELETE CASCADE`.

## Estrutura

```
src/
  index.ts                 -> ponto de entrada: sobe o Express e registra as rotas
  data-source.ts           -> configuração da conexão TypeORM (lê variáveis de ambiente)
  run-seeds.ts             -> executor dos seeds (conecta, roda, encerra a conexão)
  controllers/
    auth.ts                  -> rota de boas-vindas ("/")
    situations.ts            -> CRUD de situações
    users.ts                 -> CRUD de usuários
    product-categories.ts    -> CRUD de categorias de produto
    product-situations.ts    -> CRUD de situações de produto
    products.ts              -> CRUD de produtos
  entity/
    situations.ts            -> entidade Situations
    users.ts                 -> entidade Users
    product-categories.ts    -> entidade ProductCategories
    product-situations.ts    -> entidade ProductSituations
    products.ts              -> entidade Products
  migration/                 -> 5 migrations (criam as tabelas e as FKs)
  seeds/                     -> dados padrão das tabelas de apoio
  services/
    pagination.service.ts    -> serviço genérico de paginação (reutilizável)
    validation.service.ts    -> validação de ID e filtragem de campos do body
    error.service.ts         -> tratamento seguro de erro (sem expor SQL na resposta)
sql/
  create_database.sql        -> script para criar o banco "node_api"
```

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o banco de dados no PostgreSQL executando `sql/create_database.sql`
   (via `psql -U postgres -h localhost -c "CREATE DATABASE node_api WITH ENCODING 'UTF8';"` ou pelo pgAdmin).
3. Copie `.env.example` para `.env` e preencha com as suas credenciais:
   ```bash
   cp .env.example .env
   ```

### Variáveis de ambiente (`.env`)

| Variável       | Descrição                                   | Padrão       |
|----------------|----------------------------------------------|--------------|
| `SERVER_PORT`  | Porta em que a API sobe                       | `8080`       |
| `DB_DIALECT`   | Dialeto do banco (`postgres`, `mysql`, `mariadb`, ...) | `postgres` |
| `DB_HOST`      | Host do banco de dados                        | `localhost`  |
| `DB_PORT`      | Porta do banco de dados                       | `5432`       |
| `DB_USERNAME`  | Usuário do banco                              | `postgres`   |
| `DB_PASSWORD`  | Senha do usuário do banco                     | —            |
| `DB_DATABASE`  | Nome do banco de dados                        | `node_api`   |

> O arquivo `.env` não é commitado (está no `.gitignore`). Use o `.env.example` como modelo.

## Ordem de setup do projeto do zero

```bash
# 1. dependências
npm install

# 2. cria o banco
psql -U postgres -h localhost -c "CREATE DATABASE node_api WITH ENCODING 'UTF8';"

# 3. copie e EDITE o .env preenchendo DB_PASSWORD com a senha do seu PostgreSQL
cp .env.example .env

# 4. compila
npm run build

# 5. cria as tabelas
npx typeorm migration:run -d dist/data-source.js

# 6. popula os dados padrão
npm run seed

# 7. sobe a API
npm run start:watch
```

## Scripts disponíveis

| Comando               | O que faz                                                             |
|-----------------------|------------------------------------------------------------------------|
| `npm run build`       | Compila o TypeScript (`src`) para JavaScript (`dist`)                 |
| `npm start`           | Executa o projeto já compilado (`dist/index.js`)                      |
| `npm run seed`        | Popula o banco com os dados padrão (`dist/run-seeds.js`)              |
| `npm run watch`       | Compila em modo observador, recompilando a cada alteração             |
| `npm run start:watch` | Roda o observador do TypeScript **e** reinicia o servidor automaticamente (usa `concurrently`) |

## Migrations

As tabelas são criadas via **migrations** do TypeORM (nunca com `synchronize: true`), para
que qualquer pessoa que clone o projeto recrie o banco idêntico com um comando.

| Comando | O que faz |
|---|---|
| `npx typeorm migration:create src/migration/NomeDaMigration` | Gera um novo arquivo de migration vazio (`up`/`down`) |
| `npm run build && npx typeorm migration:run -d dist/data-source.js` | Compila e aplica as migrations pendentes |
| `npx typeorm migration:revert -d dist/data-source.js` | Desfaz a última migration aplicada (roda o `down`) |

Migrations existentes, em ordem de execução: `CreateSituations`, `CreateUsers`,
`CreateProductCategories`, `CreateProductSituations`, `CreateProducts`.

## Rotas da API

Todas as entidades seguem o mesmo padrão de CRUD. Substitua `{recurso}` por
`situations`, `users`, `product-categories`, `product-situations` ou `products`:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/{recurso}?page=1&limit=10` | Lista paginada (ordem `id` DESC). Retorna `error`, `data`, `currentPage`, `lastPage`, `totalRecords` |
| GET | `/{recurso}/view/:id` | Retorna um registro específico (404 se não existir) |
| POST | `/{recurso}` | Cadastra um registro (201) |
| PUT | `/{recurso}/edit/:id` | Atualiza um registro (404 se não existir) |
| DELETE | `/{recurso}/delete/:id` | Remove um registro (404 se não existir) |

Além dessas, `GET /` devolve a mensagem de boas-vindas.

### Corpo das requisições (POST / PUT)

```jsonc
// POST /situations
{ "nameSituation": "ativo" }

// POST /users
{ "name": "Vinicius", "email": "vinicius@teste.com", "situationId": 1 }

// POST /product-categories  |  POST /product-situations
{ "name": "eletrônicos" }

// POST /products
{ "name": "Notebook", "productCategoryId": 1, "productSituationId": 1 }
```

> O `POST` exige o header `Content-Type: application/json`.

### Validações e códigos de resposta

| Situação | Resposta |
|---|---|
| Campo obrigatório ausente ou vazio | **400** com a lista de campos faltando |
| ID da rota não numérico (`/view/abc`) | **400** `ID inválido` |
| Registro não encontrado | **404** |
| Chave estrangeira inexistente (`situationId`, `productCategoryId`, `productSituationId`) | **400** com mensagem explicativa |
| Valor único repetido (`email`, `nameSituation`, `name`) | **400** |
| Página inexistente na paginação | **400** com o total de páginas |
| Falha inesperada | **500** com mensagem genérica (o erro completo vai só para o log do servidor) |

O corpo das requisições passa por uma **whitelist de campos**: um `id` enviado no body é
descartado, então um `POST` nunca sobrescreve um registro existente. As rotas `view/:id`
de `users` e `products` trazem as entidades relacionadas já carregadas.

## Seeds

Seeds cadastram **dados padrão** no banco, para que quem clonar o projeto já tenha
registros para testar:

```bash
npm run build && npm run seed
```

| Tabela | Registros padrão |
|---|---|
| `situations` | ativo, inativo, pendente |
| `product_categories` | eletrônicos, vestuário, alimentos, livros |
| `product_situations` | disponível, esgotado, descontinuado |

São **idempotentes**: se a tabela já tiver registros, o seed não faz nada (não duplica).
Para criar um novo seed, adicione o arquivo em `src/seeds/` e registre a instância em
`src/run-seeds.ts`.

## Paginação

A paginação vive em `src/services/pagination.service.ts` e serve **qualquer** repositório
do TypeORM — por isso as 5 listagens usam a mesma implementação:

```ts
const result = await PaginationService.paginate(repository, page, limit, { id: 'DESC' });
```

| Parâmetro | Descrição | Padrão |
|---|---|---|
| `repository` | Repositório da entidade a paginar | — |
| `page` | Página solicitada | `1` |
| `limit` | Registros por página | `10` |
| `order` | Ordenação (`FindOptionsOrder`) | `{}` |

Retorna `{ error, data, currentPage, lastPage, totalRecords }`. Se a página pedida não
existir, lança um `Error` com o total de páginas, tratado no `catch` do controller.

> **Consultando no pgAdmin:** como os nomes das colunas são camelCase, o PostgreSQL exige
> aspas duplas nas consultas manuais:
> `SELECT "nameSituation" FROM situations;`
