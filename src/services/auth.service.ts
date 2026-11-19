import dotenv from 'dotenv';
dotenv.config({ quiet: true }); // carregar as variáveis de ambiente (JWT_SECRET) do .env

import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { Users } from '../entity/users';

// Erro de credenciais (e-mail ou senha errados): o controller responde 401
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Dados devolvidos no login: dados públicos do usuário + token
export interface LoginResult {
  id: number;
  name: string;
  email: string;
  token: string;
}

export class AuthService {
  // repositório do usuário no banco de dados
  private userRepository = AppDataSource.getRepository(Users);

  /**
   * Autentica o usuário com e-mail e senha.
   * Retorna os dados do usuário e o token JWT, ou lança AuthError
   * se as credenciais estiverem erradas.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // busca o usuário pelo e-mail; como a coluna password é select: false,
    // ela precisa ser pedida explicitamente aqui para podermos comparar
    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });

    // boa prática: a mesma mensagem para e-mail errado e senha errada,
    // para não revelar a quem está tentando qual dos dois acertou
    if (!user) {
      throw new AuthError('Usuário ou senha inválidos');
    }

    // compara a senha digitada com o hash do banco (bcrypt)
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AuthError('Usuário ou senha inválidos');
    }

    // segredo usado para assinar o token, vindo do .env
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      // falha de configuração do servidor, não do usuário (vira 500)
      throw new Error('JWT_SECRET não definido no arquivo .env');
    }

    // gera o token com o id do usuário; expira em 7 dias (desenvolvimento).
    // Em produção o professor recomenda no máximo 1 dia, ou poucas horas.
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    };
  }
}
