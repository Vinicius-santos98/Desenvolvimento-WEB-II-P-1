import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar variáveis de ambiente do .env

import { DataSource } from 'typeorm';
import { Situations } from './entity/situations';
import { Users } from './entity/users';

// Dialeto do banco de dados (postgres, mysql, mariadb, mongodb...) vindo do .env,
// com "postgres" como padrão caso a variável não esteja definida.
const dbDialect = process.env.DB_DIALECT || 'postgres';

export const AppDataSource = new DataSource({
  type: dbDialect as any,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'node_api',
  synchronize: false,
  logging: true,
  entities: [Situations, Users],
  migrations: ['dist/migration/*.js'],
});

// Inicializar a conexão com o banco de dados
AppDataSource.initialize()
  .then(() => {
    console.log('Conexão com o banco de dados realizado com sucesso');
  })
  .catch((error) => {
    console.log('Erro na conexão com o banco de dados', error);
  });
