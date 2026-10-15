import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar variáveis de ambiente do arquivo .env

import express from 'express';
import { AppDataSource } from './data-source';
import auth from './controllers/auth';
import situations from './controllers/situations';
import users from './controllers/users';
import productCategories from './controllers/product-categories';
import productSituations from './controllers/product-situations';
import products from './controllers/products';

const app = express();
const port = process.env.SERVER_PORT || 8080;

// Middleware para receber dados no corpo (body) das requisições em JSON
app.use(express.json());

// Rotas
app.use('/', auth);
app.use('/situations', situations);
app.use('/users', users);
app.use('/product-categories', productCategories);
app.use('/product-situations', productSituations);
app.use('/products', products);

// Inicializar a conexão com o banco de dados e só então subir o servidor
AppDataSource.initialize()
  .then(() => {
    console.log('Conexão com o banco de dados realizado com sucesso');

    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port} - http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Erro na conexão com o banco de dados', error);
    process.exit(1);
  });
