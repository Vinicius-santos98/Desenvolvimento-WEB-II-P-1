import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar variáveis de ambiente do arquivo .env

import express from 'express';
import login from './controllers/login';

const app = express();
const port = process.env.SERVER_PORT || 8080;

// Rotas
app.use('/', login);

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port} - http://localhost:${port}`);
});
