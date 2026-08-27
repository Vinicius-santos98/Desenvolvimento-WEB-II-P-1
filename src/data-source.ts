import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Dialeto do banco de dados (mysql, mariadb, postgres, mongodb...) vindo do .env,
// com "mysql" como padrão caso a variável não esteja definida.
const dbDialect = process.env.DB_DIALECT || 'mysql';

export const AppDataSource = new DataSource({
  type: dbDialect as any,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'node_api',
  synchronize: false,
  logging: true,
  entities: [],
});
