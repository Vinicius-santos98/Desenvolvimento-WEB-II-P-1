import { Response } from 'express';
import { PaginationError } from './pagination.service';

// Erros do PostgreSQL que são culpa do cliente (400), não falha do servidor (500)
const CLIENT_ERRORS: Record<string, string> = {
  '23505': 'Já existe um registro cadastrado com esse valor único.',
  '23503': 'O registro relacionado informado não existe.',
  '23502': 'Campo obrigatório não informado.',
  '22P02': 'Valor inválido informado.',
};

/**
 * Trata o erro de um controller de forma segura.
 * O erro completo vai para o log do servidor; a resposta HTTP leva apenas
 * uma mensagem limpa, sem expor SQL, parâmetros ou estrutura do banco.
 */
export function handleError(
  response: Response,
  error: unknown,
  fallbackMessage: string,
): Response {
  // registra o erro completo no servidor, para diagnóstico
  console.error(`${fallbackMessage}:`, error);

  // página inexistente é erro do cliente
  if (error instanceof PaginationError) {
    return response.status(400).json({ message: error.message });
  }

  const code = (error as { code?: string })?.code;

  if (code && CLIENT_ERRORS[code]) {
    return response.status(400).json({ message: CLIENT_ERRORS[code] });
  }

  return response.status(500).json({ message: fallbackMessage });
}
