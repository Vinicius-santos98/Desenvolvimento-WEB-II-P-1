import { Router, Request, Response } from 'express';

const router = Router();

// Rota para testar se a API está no ar (ex.: depois de publicar em um servidor)
router.get('/', (request: Request, response: Response) => {
  return response.status(200).json({ message: 'Conexão com API realizada com sucesso' });
});

export default router;
