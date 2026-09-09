import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar variáveis de ambiente do arquivo .env

import express from 'express';
import { AppDataSource } from './data-source';
import auth from './controllers/auth';
import situations from './controllers/situations';

const app = express();
const port = process.env.SERVER_PORT || 8080;

// Inicializar a conexão com o banco de dados
AppDataSource.initialize()
  .then(() => {
    console.log('Conexão com o banco de dados realizado com sucesso');
  })
  .catch((error) => {
    console.log('Erro na conexão com o banco de dados', error);
  });

// Middleware para receber dados no corpo (body) das requisições em JSON
app.use(express.json());

// Rotas
app.use('/', auth);
app.use('/situations', situations);

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port} - http://localhost:${port}`);
});
