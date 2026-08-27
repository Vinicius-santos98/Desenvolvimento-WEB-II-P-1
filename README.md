# Baião P1 — API Node.js + TypeScript

Projeto criado seguindo a **Aula 01 - Configurando API NODEJS**: ambiente de desenvolvimento
para uma API com Node.js, TypeScript, Express, MySQL e TypeORM.

## Requisitos

- [Node.js](https://nodejs.org/) 22 ou superior (verifique com `node -v`)
- [MySQL](https://dev.mysql.com/downloads/mysql/) instalado e em execução
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado)

## Estrutura

```
src/
  index.ts               -> ponto de entrada: cria o app Express e sobe o servidor
  data-source.ts         -> configuração da conexão TypeORM (lê variáveis de ambiente)
  controllers/
    login.ts              -> rotas e inicialização da conexão com o banco
sql/
  create_database.sql    -> script para criar o banco "node_api" no MySQL
```

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o banco de dados no MySQL executando `sql/create_database.sql`
   (via `mysql -u root -p < sql/create_database.sql` ou colando no MySQL Workbench).
3. Copie `.env.example` para `.env` e preencha com as suas credenciais do MySQL:
   ```bash
   cp .env.example .env
   ```

### Variáveis de ambiente (`.env`)

| Variável       | Descrição                                   | Padrão      |
|----------------|----------------------------------------------|-------------|
| `SERVER_PORT`  | Porta em que a API sobe                       | `8080`      |
| `DB_DIALECT`   | Dialeto do banco (`mysql`, `mariadb`, `postgres`, `mongodb`, ...) | `mysql` |
| `DB_HOST`      | Host do banco de dados                        | `localhost` |
| `DB_PORT`      | Porta do banco de dados                       | `3306`      |
| `DB_USERNAME`  | Usuário do banco                              | `root`      |
| `DB_PASSWORD`  | Senha do usuário do banco                     | —           |
| `DB_DATABASE`  | Nome do banco de dados                        | `node_api`  |

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

## Próximos passos

Na próxima aula: criação das entidades/rotas da API de fato, com persistência de dados no
banco via TypeORM.
