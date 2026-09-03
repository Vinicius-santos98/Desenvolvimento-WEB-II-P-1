import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar variáveis de ambiente do arquivo .env

import express from 'express';
import auth from './controllers/auth';
import situations from './controllers/situations';

const app = express();
const port = process.env.SERVER_PORT || 8080;

// Middleware para receber dados no corpo (body) das requisições em JSON
app.use(express.json());

// Rotas
app.use('/', auth);
app.use('/situations', situations);

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port} - http://localhost:${port}`);
});
