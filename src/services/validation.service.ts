import { DeepPartial } from 'typeorm';

/**
 * Converte o parâmetro de rota em um ID válido.
 * Devolve null quando não é um número inteiro positivo (ex: "abc", "1abc", "-1"),
 * para o controller responder 400 em vez de deixar um NaN chegar ao banco.
 */
export function parseId(value: unknown): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/**
 * Extrai do corpo da requisição apenas os campos permitidos.
 * Impede que um "id" enviado no body sobrescreva um registro existente no save().
 */
export function pickFields<T>(body: any, fields: (keyof T & string)[]): DeepPartial<T> {
  const data: any = {};

  for (const field of fields) {
    if (body?.[field] !== undefined) {
      data[field] = body[field];
    }
  }

  return data as DeepPartial<T>;
}

/**
 * Verifica se todos os campos obrigatórios foram informados.
 * Devolve a mensagem de erro, ou null quando está tudo certo.
 */
export function requireFields(data: any, fields: string[]): string | null {
  const missing = fields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === '',
  );

  if (missing.length > 0) {
    return `Campo(s) obrigatório(s) não informado(s): ${missing.join(', ')}`;
  }

  return null;
}
