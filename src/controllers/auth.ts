import { Router, Request, Response } from 'express';
// biblioteca de validação
import * as yup from 'yup';
// biblioteca nativa do Node para gerar chaves aleatórias seguras
import crypto from 'crypto';
import { AppDataSource } from '../data-source';
import { Users } from '../entity/users';
import { AuthError, AuthService } from '../services/auth.service';
import { handleError } from '../services/error.service';

const router = Router();

// Login: recebe e-mail e senha no corpo da requisição e devolve
// os dados do usuário com o token de autenticação (JWT)
router.post('/', async (request: Request, response: Response) => {
  try {
    // extrai o e-mail e a senha do corpo da requisição
    // (sem corpo, o Express 5 deixa request.body undefined)
    const { email, password } = request.body ?? {};

    // os dois são obrigatórios e precisam ser texto
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return response.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    // instancia o serviço de autenticação e valida as credenciais
    const authService = new AuthService();
    const userData = await authService.login(email, password);

    return response.status(200).json({
      message: 'Login realizado com sucesso',
      user: userData,
    });
  } catch (error) {
    // e-mail ou senha errados: 401 (não autorizado)
    if (error instanceof AuthError) {
      return response.status(401).json({ message: error.message });
    }

    // qualquer outro erro (banco fora do ar, .env sem JWT_SECRET...) é do servidor
    return handleError(response, error, 'Erro ao realizar login');
  }
});

// Verifica se o texto é um endereço http(s) válido. O yup.string().url()
// não foi usado porque ele recusa "localhost" (ex.: http://localhost:3000)
function isHttpUrl(value: string | undefined): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Recuperar senha: gera uma chave única para o usuário e devolve o link
// para a página de troca de senha
// POST /recover-password
// body: { "email": "...", "urlRecoverPassword": "http://localhost:3000/recover-password" }
router.post('/recover-password', async (request: Request, response: Response) => {
  try {
    // recebe os dados enviados no corpo da requisição
    const data = {
      email: request.body?.email,
      urlRecoverPassword: request.body?.urlRecoverPassword,
    };

    // validação: só o e-mail e a URL
    const schema = yup.object().shape({
      email: yup
        .string()
        .email('O campo e-mail deve ser um e-mail válido')
        .required('O campo e-mail é obrigatório'),
      urlRecoverPassword: yup
        .string()
        .required('O campo URL é obrigatório')
        .test('http-url', 'O campo URL deve ser um endereço válido (http ou https)', isHttpUrl),
    });

    await schema.validate(data, { abortEarly: false });

    const userRepository = AppDataSource.getRepository(Users);

    // busca o usuário pelo e-mail
    const user = await userRepository.findOne({ where: { email: data.email } });

    // se o usuário não for encontrado: 404
    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' });
    }

    // gera uma chave segura de 64 caracteres: 32 bytes aleatórios em hexadecimal.
    // A cada pedido uma chave nova substitui a anterior
    const key = crypto.randomBytes(32).toString('hex');
    user.recoverPassword = key;

    // salva a chave no banco de dados
    await userRepository.save(user);

    // monta o link: URL recebida + ?email=...&key=...
    // (o URL/searchParams codifica os caracteres especiais do e-mail, como "+" e "@")
    const link = new URL(data.urlRecoverPassword);
    link.searchParams.set('email', data.email);
    link.searchParams.set('key', key);

    return response.status(200).json({
      message: 'Gerado o link para recuperar a senha',
      urlRecoverPassword: link.toString(),
    });
  } catch (error) {
    // erros de validação do Yup
    if (error instanceof yup.ValidationError) {
      return response.status(400).json({ message: error.errors });
    }

    return handleError(response, error, 'Erro ao gerar o link para recuperar a senha');
  }
});

export default router;
