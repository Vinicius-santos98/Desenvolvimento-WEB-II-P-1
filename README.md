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
    login.ts              -> rotas e inicialização da conexão com o banco
  entity/
    situations.ts          -> entidade Situations (1 situação -> muitos usuários)
    users.ts               -> entidade Users (muitos usuários -> 1 situação)
  migration/
    *-CreateSituations.ts   -> cria a tabela "situations"
    *-CreateUsers.ts        -> cria a tabela "users" + FK para "situations"
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

## Próximos passos

Próxima aula: criação das rotas/CRUD da API de fato, usando os `Repository` do TypeORM
sobre as entidades `Situations` e `Users` para ler e gravar dados no banco.
