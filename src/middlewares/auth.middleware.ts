import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar as variáveis de ambiente (JWT_SECRET) do .env

import { Request, Response, NextFunction } from 'express';
// biblioteca para manipular os tokens
import jwt from 'jsonwebtoken';
import { handleError } from '../services/error.service';

// Requisição com o usuário autenticado: o middleware preenche request.user
// com o id que estava dentro do token, para as rotas usarem depois
export interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

/**
 * Middleware de autenticação: valida o token JWT antes de liberar uma rota restrita.
 *
 * O token vem no cabeçalho da requisição, no formato:
 *   Authorization: Bearer <token>
 *
 * @param request  objeto da requisição (recebe request.user se o token for válido)
 * @param response objeto da resposta (usado para devolver 401 se o token faltar ou for inválido)
 * @param next     função que passa o controle para a próxima função da rota
 */
export function verifyToken(request: AuthRequest, response: Response, next: NextFunction): void {
  // 1. obtém o token do cabeçalho da requisição
  const authHeader = request.headers.authorization;

  // 2. verifica se o cabeçalho contém o token
  if (!authHeader) {
    response.status(401).json({ message: 'Necessário enviar o token de autenticação' });
    return;
  }

  // 3. separa o prefixo "Bearer" do token: o cabeçalho vem como "Bearer eyJhbGciOi..."
  const [bearer, token] = authHeader.split(' ');

  // 4. o formato precisa ser "Bearer <token>"
  if (!token || bearer.toLowerCase() !== 'bearer') {
    response.status(401).json({ message: 'Token inválido. Use o formato: Bearer <token>' });
    return;
  }

  // segredo usado para assinar o token no login (o mesmo do auth.service)
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // falha de configuração do servidor, não do usuário (vira 500)
    handleError(response, new Error('JWT_SECRET não definido no arquivo .env'), 'Erro ao validar o token');
    return;
  }

  try {
    // 5. verifica e decodifica o token: confere a assinatura (feita com o JWT_SECRET)
    // e a validade (7 dias). Se o token foi alterado, assinado com outro segredo
    // ou já expirou, o jwt.verify lança um erro e cai no catch.
    // algorithms: só aceita o algoritmo usado no login (HS256)
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: number };

    // 6. atribui o id do usuário autenticado à requisição
    request.user = { id: decoded.id };

    // 7. passa o controle para a próxima função da rota
    next();
  } catch (error) {
    response.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
