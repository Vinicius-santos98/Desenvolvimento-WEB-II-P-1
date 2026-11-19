# Baião P1 — API Node.js + TypeScript

API REST desenvolvida com **Node.js, Express, TypeScript, PostgreSQL, TypeORM, Yup, bcryptjs, slugify e jsonwebtoken (JWT)**, seguindo
o diagrama entidade-relacionamento do Projeto P1.

## Itens da avaliação

| Item | Onde está |
|---|---|
| Configuração da API | `src/index.ts`, `package.json`, `tsconfig.json` |
| Models / Entitys | `src/entity/` (5 entidades — no TypeORM a entity é o model), registradas em `src/data-source.ts` |
| Variáveis de Ambiente | `.env.example` + `dotenv` em `src/index.ts`, `src/data-source.ts`, `src/services/auth.service.ts` e `src/middlewares/auth.middleware.ts` |
| Migrations | `src/migration/` (9 migrations: 5 criam as tabelas com FKs e 4 alteram tabelas existentes, todas com rollback) |
| CRUD | `src/controllers/` — as 5 operações para cada uma das 5 entidades |
| Controllers | `src/controllers/`, registrados em `src/index.ts` |
| Seeds | `src/seeds/` (5 seeds), executados por `src/run-seeds.ts` |
| Services (Pagination) | `src/services/pagination.service.ts`, usado nas 5 listagens |
| Autenticação | `POST /` com e-mail e senha devolve um token JWT — `src/controllers/auth.ts` + `src/services/auth.service.ts` |
| Rota restrita | middleware `verifyToken` valida o token — `src/middlewares/auth.middleware.ts`, aplicado em `GET /users` |
| Recuperar senha | `POST /recover-password` gera uma chave única e devolve o link de troca de senha — `src/controllers/auth.ts` |
| Testes | `postman/` — collection com 47 requisições e 104 asserções (ver [Testes](#testes-postman)) |

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
| `users` | `id`, `name`, `email` (único), `password`, `recoverPassword` (único, pode ser nulo), `situationId` (FK), `createdAt`, `updatedAt` |
| `product_categories` | `id`, `name` (único), `createdAt`, `updatedAt` |
| `product_situations` | `id`, `name` (único), `createdAt`, `updatedAt` |
| `products` | `id`, `name`, `slug` (único, gerado do nome), `description`, `price`, `productSituationId` (FK), `productCategoryId` (FK), `createdAt`, `updatedAt` |

Todas as chaves estrangeiras usam `ON DELETE CASCADE`.

## Estrutura

```
src/
  index.ts                 -> ponto de entrada: sobe o Express e registra as rotas
  data-source.ts           -> configuração da conexão TypeORM (lê variáveis de ambiente)
  run-seeds.ts             -> executor dos seeds (conecta, roda, encerra a conexão)
  controllers/
    auth.ts                  -> login ("POST /") e recuperar senha ("POST /recover-password")
    test-connection.ts       -> rota de teste de conexão ("/test-connection")
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
  middlewares/
    auth.middleware.ts       -> verifyToken: valida o token JWT nas rotas restritas
  migration/                 -> 9 migrations (5 criam as tabelas e as FKs; 4 adicionam colunas)
  seeds/                     -> dados padrão (situações, usuários, categorias, situações de produto e produtos)
  services/
    auth.service.ts          -> autenticação: confere e-mail/senha (bcrypt) e gera o token JWT
    pagination.service.ts    -> serviço genérico de paginação (reutilizável)
    slug.service.ts          -> gera o slug a partir de um nome (usado no controller e no seed)
    validation.service.ts    -> validação de ID e filtragem de campos do body
    error.service.ts         -> tratamento seguro de erro (sem expor SQL na resposta)
sql/
  create_database.sql        -> script para criar o banco "node_api"
postman/
  API P1 — Baião.postman_collection.json -> 47 requisições com testes automatizados
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
| `JWT_SECRET`   | Segredo que assina os tokens de login (texto longo e aleatório) | —  |

> O arquivo `.env` não é commitado (está no `.gitignore`). Use o `.env.example` como modelo.
>
> Para gerar um `JWT_SECRET` seguro:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
> Quem tem o segredo consegue criar tokens válidos, então ele nunca deve ir para o Git.

## Ordem de setup do projeto do zero

```bash
# 1. dependências
npm install

# 2. cria o banco
psql -U postgres -h localhost -c "CREATE DATABASE node_api WITH ENCODING 'UTF8';"

# 3. copie e EDITE o .env preenchendo DB_PASSWORD (senha do PostgreSQL) e JWT_SECRET
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
`CreateProductCategories`, `CreateProductSituations`, `CreateProducts`, `AddPasswordToUsers`,
`AddSlugToProducts`, `AddDescriptionAndPriceToProducts` e `AddRecoverPasswordToUsers`.

A `AddPasswordToUsers` mostra como **alterar uma tabela que já existe**: em vez de editar a
migration que criou `users`, uma migration nova adiciona a coluna `password`
(`queryRunner.addColumn`), e o `down` a remove (`queryRunner.dropColumn`). Como a coluna é
obrigatória, o PostgreSQL só aceita adicioná-la se a tabela `users` estiver vazia — com
usuários cadastrados, é preciso esvaziar a tabela antes. No PostgreSQL a coluna nova fica no
fim da tabela (o `AFTER` usado para reposicionar colunas é exclusivo do MySQL).

Já a `AddRecoverPasswordToUsers` adiciona uma coluna que **pode ser nula** (`isNullable: true`),
então ela é aplicada mesmo com usuários já cadastrados: eles simplesmente ficam com `NULL`.

## Rotas da API

`situations`, `product-categories`, `product-situations` e `products` seguem o mesmo padrão
de CRUD — substitua `{recurso}` pelo nome:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/{recurso}?page=1&limit=10` | Lista paginada (ordem `id` DESC). Retorna `error`, `data`, `currentPage`, `lastPage`, `totalRecords` |
| GET | `/{recurso}/view/:id` | Retorna um registro específico (404 se não existir) |
| POST | `/{recurso}` | Cadastra um registro (201) |
| PUT | `/{recurso}/edit/:id` | Atualiza um registro (404 se não existir) |
| DELETE | `/{recurso}/delete/:id` | Remove um registro (404 se não existir) |

### Usuários

Os usuários seguem o padrão REST adotado a partir da Aula 14 — o `id` vai direto na rota:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users?page=1&limit=10` | Lista paginada (ordem `id` DESC) — **rota restrita, exige token** |
| GET | `/users/:id` | Retorna um usuário com a situação relacionada (404 se não existir) |
| POST | `/users` | Cadastra um usuário (201) — a senha é obrigatória só aqui |
| PUT | `/users/:id` | Atualiza um usuário — exige todos os campos (404 se não existir) |
| PATCH | `/users/:id/password` | Altera só a senha — body: `{ "password": "..." }` (404 se não existir) |
| DELETE | `/users/:id` | Remove um usuário (404 se não existir) |

A senha **nunca é devolvida** pela API: a coluna é marcada com `select: false` na entidade, e
as respostas do cadastro e da troca de senha removem o campo antes de responder. Ela é gravada
**criptografada com bcrypt** (custo 10): o banco guarda só o hash (`$2b$10$...`), nunca a senha.
A troca de senha tem rota própria (`PATCH`), separada da edição dos dados, que ignora o campo.

Além dessas, `GET /test-connection` devolve
`{ "message": "Conexão com API realizada com sucesso" }` — útil para confirmar que a API está
no ar depois de publicar num servidor.

### Autenticação (login)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Login — body: `{ "email": "...", "password": "..." }` |

```jsonc
// POST /   { "email": "admin@example.com", "password": "123456" }
// 200
{
  "message": "Login realizado com sucesso",
  "user": { "id": 1, "name": "Usuário Administrador", "email": "admin@example.com", "token": "eyJhbGciOi..." }
}
```

Como funciona (`src/services/auth.service.ts`):

1. Busca o usuário pelo e-mail. A senha é `select: false`, então a consulta pede a coluna explicitamente.
2. Compara a senha digitada com o hash do banco com `bcrypt.compare` (método `comparePassword` da entidade `Users`).
3. Se estiver certa, gera um **token JWT** com o `id` do usuário, assinado com o `JWT_SECRET` do `.env`
   e válido por **7 dias** (em desenvolvimento; em produção o recomendado é no máximo 1 dia).

E-mail inexistente e senha errada devolvem **a mesma mensagem** (`Usuário ou senha inválidos`),
para não revelar a quem tenta entrar se o e-mail está cadastrado.

### Rotas restritas (token)

Uma rota restrita só responde se a requisição trouxer um token válido no cabeçalho:

```
Authorization: Bearer eyJhbGciOi...
```

Quem faz essa checagem é o middleware `verifyToken` (`src/middlewares/auth.middleware.ts`), que roda
**antes** da função da rota:

1. Lê o cabeçalho `Authorization`. Se não vier → **401** `Necessário enviar o token de autenticação`.
2. Separa o prefixo `Bearer` do token (`split(' ')`). Se o formato não for `Bearer <token>` → **401**.
3. Confere o token com `jwt.verify` e o `JWT_SECRET`. Token falso, alterado, assinado com outro
   segredo ou expirado → **401** `Token inválido ou expirado`.
4. Se o token for válido, guarda o id do usuário em `request.user` e chama `next()`, liberando a rota.

Para proteger outra rota, basta colocar o middleware antes da função:

```ts
import { verifyToken } from '../middlewares/auth.middleware';

router.get('/', verifyToken, async (request, response) => { ... });
```

Por enquanto, como na aula, só a listagem de usuários (`GET /users`) é restrita.

### Recuperar senha

| Método | Rota | Descrição |
|---|---|---|
| POST | `/recover-password` | Gera a chave de recuperação e devolve o link para trocar a senha |

```jsonc
// POST /recover-password
{ "email": "admin@example.com", "urlRecoverPassword": "http://localhost:3000/recover-password" }

// 200
{
  "message": "Gerado o link para recuperar a senha",
  "urlRecoverPassword": "http://localhost:3000/recover-password?email=admin%40example.com&key=3ba1837b..."
}
```

- `urlRecoverPassword` é o endereço da página (do front-end) onde o usuário vai digitar a senha nova.
- A chave (`key`) tem 64 caracteres: 32 bytes aleatórios gerados com `crypto.randomBytes` e
  convertidos para hexadecimal. Ela fica gravada na coluna `recoverPassword` do usuário, e cada
  pedido novo gera uma chave nova que substitui a anterior.
- Assim como a senha, a coluna `recoverPassword` é `select: false`: a chave nunca aparece nas
  outras rotas (quem tivesse a chave poderia trocar a senha).
- O e-mail vai codificado no link (`@` vira `%40`, `+` vira `%2B`), e o front-end lê o valor
  original com `URLSearchParams`.

> **Atenção (fase de desenvolvimento):** como na aula, o link volta na própria resposta da API,
> para facilitar os testes. Num sistema publicado ele deve ser enviado **só por e-mail**; se a
> resposta trouxer o link, qualquer pessoa que souber um e-mail cadastrado consegue a chave.

### Requisições externas (CORS)

O middleware `cors` está ativo em todas as rotas, então front-ends hospedados em outros
endereços conseguem consumir a API pelo navegador. Ele responde com
`Access-Control-Allow-Origin: *` e atende o *preflight* (`OPTIONS`) que o navegador faz antes
de um `POST`/`PUT` com JSON. Ferramentas como Postman e cURL não dependem disso — o CORS é
uma regra aplicada pelo navegador.

### Corpo das requisições (POST / PUT)

```jsonc
// POST /situations
{ "nameSituation": "ativo" }

// POST /users   (no PUT, a senha é ignorada)
{ "name": "Vinicius", "email": "vinicius@teste.com", "password": "123456", "situationId": 1 }

// POST /product-categories  |  POST /product-situations
{ "name": "eletrônicos" }

// PATCH /users/:id/password
{ "password": "654321" }

// POST /products   (o slug é gerado do nome; um slug enviado no body é ignorado)
{ "name": "Notebook", "description": "16 GB de RAM", "price": 3999.9, "productCategoryId": 1, "productSituationId": 1 }
```

> O `POST` exige o header `Content-Type: application/json`.

### Validações e códigos de resposta

| Situação | Resposta |
|---|---|
| Campo obrigatório ausente ou vazio | **400** com a lista de campos faltando |
| `nameSituation` vazio ou com menos de 3 caracteres (cadastro e edição de situações, validado com **Yup**) | **400** com a lista de todas as regras violadas |
| ID da rota não numérico (`/view/abc`) | **400** `ID inválido` |
| Registro não encontrado | **404** |
| Chave estrangeira inexistente (`situationId`, `productCategoryId`, `productSituationId`) | **400** com mensagem explicativa |
| Valor único repetido (`email`, `nameSituation`, `name`) | **400** |
| Nome de situação já cadastrado (verificado antes de gravar; na edição o próprio registro é ignorado) | **400** `Já existe uma situação cadastrada com esse nome` |
| Usuário com nome vazio ou com menos de 3 caracteres, e-mail vazio ou inválido, sem situação, ou (no cadastro) senha vazia ou com menos de 6 caracteres — validado com **Yup** | **400** com a lista de todas as regras violadas |
| E-mail de usuário já cadastrado (na edição o próprio registro é ignorado) | **400** `Já existe um usuário cadastrado com esse e-mail` |
| Troca de senha com senha vazia ou com menos de 6 caracteres | **400** com a lista de regras violadas |
| Produto com nome vazio, com menos de 3 ou mais de 255 caracteres, sem descrição, com preço ausente/não numérico/menor ou igual a zero, ou sem categoria/situação — validado com **Yup** | **400** com a lista de todas as regras violadas |
| Produto cujo nome gera um slug já usado por outro produto (ex.: "Café Pilão" e "cafe pilao") | **400** `Já existe um produto com esse nome (slug "...")` |
| Login sem e-mail ou sem senha | **400** `E-mail e senha são obrigatórios` |
| Login com e-mail inexistente ou senha errada | **401** `Usuário ou senha inválidos` |
| Recuperar senha sem e-mail, com e-mail inválido ou sem URL | **400** com a lista de regras violadas |
| Recuperar senha com URL que não é `http`/`https` (ex.: `meusite`) | **400** `O campo URL deve ser um endereço válido (http ou https)` |
| Recuperar senha com e-mail não cadastrado | **404** `Usuário não encontrado` |
| Rota restrita sem o cabeçalho `Authorization` | **401** `Necessário enviar o token de autenticação` |
| Rota restrita com cabeçalho fora do formato `Bearer <token>` | **401** `Token inválido. Use o formato: Bearer <token>` |
| Rota restrita com token falso, alterado ou expirado | **401** `Token inválido ou expirado` |
| Página inexistente na paginação | **400** com o total de páginas |
| Falha inesperada | **500** com mensagem genérica (o erro completo vai só para o log do servidor) |

O corpo das requisições passa por uma **whitelist de campos**: um `id` enviado no body é
descartado, então um `POST` nunca sobrescreve um registro existente. As rotas `GET /users/:id`
e `GET /products/view/:id` trazem as entidades relacionadas já carregadas.

## Seeds

Seeds cadastram **dados padrão** no banco, para que quem clonar o projeto já tenha
registros para testar:

```bash
npm run build && npm run seed
```

| Tabela | Registros padrão |
|---|---|
| `situations` | ativo, inativo, pendente |
| `users` | Usuário Administrador (`admin@example.com`) e Usuário Teste (`teste@example.com`), ambos com a situação 1 e senha `123456` (gravada com bcrypt) |
| `product_categories` | eletrônicos, vestuário, alimentos, livros |
| `product_situations` | disponível, esgotado, descontinuado |
| `products` | Smartphone Galaxy A55, Camiseta Básica Algodão, Café Torrado e Moído 500g, Livro Clean Code — com descrição, preço e slug |

São **idempotentes**: se a tabela já tiver registros, o seed não faz nada (não duplica).
A ordem dos seeds segue as chaves estrangeiras: `users` roda depois de `situations`, e
`products` depois de `product_categories` e `product_situations`.
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

## Testes (Postman)

A pasta `postman/` traz uma collection com **47 requisições e 104 asserções automatizadas**,
cobrindo o login, a recuperação de senha, o CRUD completo dos 5 recursos e 16 casos de erro (404, 400 de validação, FK
inexistente, valor único duplicado, página inválida, tentativa de sobrescrita via `id` e
login sem dados, com senha errada e com e-mail inexistente, rota restrita sem token, com
token fora do formato e com token falso, e recuperação de senha sem dados, com URL inválida e com
e-mail não cadastrado). Na pasta de usuários, depois da troca
de senha, a collection confirma que o login passa a aceitar a senha nova e recusa a antiga.

O login da pasta `00 - Geral` usa o usuário do seed (`admin@example.com` / `123456`), e o
token recebido fica guardado na variável `token` da collection. Logo depois, "Recuperar senha" gera o
link para o mesmo usuário e guarda a chave na variável `recoverKey`. A listagem de usuários (rota
restrita) envia esse token na aba **Authorization → Bearer Token** (`{{token}}`). Por isso, ao
rodar uma pasta sozinha, execute antes o login da pasta `00 - Geral`.

### Como rodar

1. Suba a API com o banco migrado e populado (passos 1 a 7 do [setup](#ordem-de-setup-do-projeto-do-zero))
2. No Postman: **Import** → selecione o arquivo `.json` da pasta `postman/`
3. Na collection, clique em **Run** → **Run API P1 — Baião**

O resultado esperado é **104 de 104 asserções aprovadas**. Também dá para rodar sem abrir o
Postman, pelo terminal:

```bash
npx newman run "postman/API P1 — Baião.postman_collection.json"
```

### Por que ela pode ser executada várias vezes

Cada `POST` guarda o `id` do registro criado numa variável da collection
(`createdSituationId`, `createdUserId`, ...), e as requisições seguintes da pasta usam essa
variável em vez de um número fixo. O `DELETE` no fim de cada pasta remove o que foi criado,
então o banco volta ao estado do seed ao final de cada execução — não é preciso resetar nada
entre uma rodada e outra.

A variável `host` vem preenchida com `http://localhost:8080`. Se a API estiver em outra porta,
altere só ela, na aba **Variables** da collection.
