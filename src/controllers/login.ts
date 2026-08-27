import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source'; // credenciais/conexão do banco de dados

const router = Router();

// Inicializar a conexão com o banco de dados
AppDataSource.initialize()
  .then(() => {
    console.log('Conexão com o banco de dados realizado com sucesso');
  })
  .catch((error) => {
    console.log('Erro na conexão com o banco de dados', error);
  });

router.get('/', (request: Request, response: Response) => {
  response.send('Bem-vindo, pessoal! Tela de login da rota.');
});

export default router;
