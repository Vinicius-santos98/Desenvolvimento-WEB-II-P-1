import { Router, Request, Response } from 'express';
import { Not } from 'typeorm';
import * as yup from 'yup';
// biblioteca para criptografar senhas
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { Users } from '../entity/users';
import { Situations } from '../entity/situations';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields } from '../services/validation.service';
// middleware que valida o token JWT nas rotas restritas
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// campos aceitos no corpo da requisição
const FIELDS: (keyof Users & string)[] = ['name', 'email', 'situationId'];

// Verifica se a situação informada existe no banco de dados
async function validateSituation(situationId: unknown): Promise<string | null> {
  const id = parseId(situationId);

  if (id === null) {
    return 'situationId deve ser um número inteiro positivo';
  }

  const situationRepository = AppDataSource.getRepository(Situations);
  const situation = await situationRepository.findOneBy({ id });

  if (!situation) {
    return 'Situação informada não existe';
  }

  return null;
}

// Listar todos os usuários (paginado) — rota restrita: exige token
// GET /users?page=1&limit=10   (cabeçalho Authorization: Bearer <token>)
router.get('/', verifyToken, async (request: Request, response: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(Users);

    // recebe a página e o limite de registros pela URL
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    // usa o serviço de paginação
    const result = await PaginationService.paginate(userRepository, page, limit, {
      id: 'DESC',
    });

    return response.status(200).json(result);
  } catch (error) {
    return handleError(response, error, 'Erro ao listar usuário');
  }
});

// Visualizar um usuário específico pelo ID (com a situação relacionada)
// GET /users/:id
router.get('/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOne({
      where: { id },
      relations: { situation: true },
    });

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' });
    }

    return response.status(200).json(user);
  } catch (error) {
    return handleError(response, error, 'Erro ao buscar usuário');
  }
});

// Cadastrar um novo usuário
// POST /users   body: { "name": "...", "email": "...", "password": "...", "situationId": 1 }
router.post('/', async (request: Request, response: Response) => {
  try {
    // aceita apenas os campos permitidos (nunca o id enviado pelo cliente);
    // a senha só é aceita no cadastro
    const data = pickFields<Users>(request.body, [...FIELDS, 'password']);

    // regras de validação dos dados do formulário
    const schema = yup.object().shape({
      name: yup
        .string()
        .required('O campo nome é obrigatório')
        .min(3, 'O campo nome deve ter no mínimo 3 caracteres'),
      email: yup
        .string()
        .email('O campo e-mail deve ser um e-mail válido')
        .required('O campo e-mail é obrigatório'),
      password: yup
        .string()
        .required('O campo senha é obrigatório')
        .min(6, 'O campo senha deve ter no mínimo 6 caracteres'),
      situationId: yup
        .number()
        .typeError('O campo situação deve ser um número')
        .required('O campo situação é obrigatório'),
    });

    // valida os dados; abortEarly: false devolve todos os erros de uma vez
    await schema.validate(data, { abortEarly: false });

    const userRepository = AppDataSource.getRepository(Users);

    // o e-mail é único: verifica se já existe um usuário com ele
    const existingUser = await userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      return response
        .status(400)
        .json({ message: 'Já existe um usuário cadastrado com esse e-mail' });
    }

    // verifica se a situação informada existe (chave estrangeira)
    const situationError = await validateSituation(data.situationId);

    if (situationError) {
      return response.status(400).json({ message: situationError });
    }

    // criptografa a senha antes de gravar (custo 10)
    data.password = await bcrypt.hash(data.password as string, 10);

    const newUser = userRepository.create(data);

    await userRepository.save(newUser);

    // não devolve a senha na resposta
    const { password, ...user } = newUser;

    return response.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      user,
    });
  } catch (error) {
    // erro de validação do Yup
    if (error instanceof yup.ValidationError) {
      return response.status(400).json({ message: error.errors });
    }

    return handleError(response, error, 'Erro ao cadastrar usuário');
  }
});

// Atualizar um usuário já cadastrado
// PUT /users/:id   body: { "name": "...", "email": "...", "situationId": 1 }
router.put('/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const data = pickFields<Users>(request.body, FIELDS);

    // regras de validação dos dados do formulário
    const schema = yup.object().shape({
      name: yup
        .string()
        .required('O campo nome é obrigatório')
        .min(3, 'O campo nome deve ter no mínimo 3 caracteres'),
      email: yup
        .string()
        .email('O campo e-mail deve ser um e-mail válido')
        .required('O campo e-mail é obrigatório'),
      situationId: yup
        .number()
        .typeError('O campo situação deve ser um número')
        .required('O campo situação é obrigatório'),
    });

    // valida os dados; abortEarly: false devolve todos os erros de uma vez
    await schema.validate(data, { abortEarly: false });

    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' });
    }

    // verifica se OUTRO usuário já usa esse e-mail (Not(id) ignora o próprio registro)
    const existingUser = await userRepository.findOne({
      where: { email: data.email, id: Not(id) },
    });

    if (existingUser) {
      return response
        .status(400)
        .json({ message: 'Já existe um usuário cadastrado com esse e-mail' });
    }

    // verifica se a situação informada existe (chave estrangeira)
    const situationError = await validateSituation(data.situationId);

    if (situationError) {
      return response.status(400).json({ message: situationError });
    }

    // atualiza os dados do usuário
    userRepository.merge(user, data);

    // salva as alterações de dados
    const updateUser = await userRepository.save(user);

    return response.status(200).json({
      message: 'Usuário atualizado com sucesso',
      user: updateUser,
    });
  } catch (error) {
    // erro de validação do Yup
    if (error instanceof yup.ValidationError) {
      return response.status(400).json({ message: error.errors });
    }

    return handleError(response, error, 'Erro ao atualizar usuário');
  }
});

// Alterar a senha de um usuário (rota própria, separada da edição dos dados)
// PATCH /users/:id/password   body: { "password": "..." }
router.patch('/:id/password', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    // aceita somente a senha no corpo da requisição
    const data = pickFields<Users>(request.body, ['password']);

    // regras de validação da senha
    const schema = yup.object().shape({
      password: yup
        .string()
        .required('O campo senha é obrigatório')
        .min(6, 'O campo senha deve ter no mínimo 6 caracteres'),
    });

    await schema.validate(data, { abortEarly: false });

    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' });
    }

    // criptografa a nova senha (custo 10)
    data.password = await bcrypt.hash(data.password as string, 10);

    // atualiza a senha e salva
    userRepository.merge(user, data);

    const updateUser = await userRepository.save(user);

    // não devolve a senha na resposta
    const { password, ...userWithoutPassword } = updateUser;

    return response.status(200).json({
      message: 'Senha do usuário atualizada com sucesso',
      user: userWithoutPassword,
    });
  } catch (error) {
    // erro de validação do Yup
    if (error instanceof yup.ValidationError) {
      return response.status(400).json({ message: error.errors });
    }

    return handleError(response, error, 'Erro ao atualizar a senha do usuário');
  }
});

// Remover um usuário cadastrado no banco de dados
// DELETE /users/:id
router.delete('/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' });
    }

    // remove o registro direto do banco de dados
    await userRepository.remove(user);

    return response.status(200).json({ message: 'Usuário removido com sucesso' });
  } catch (error) {
    return handleError(response, error, 'Erro ao remover usuário');
  }
});

export default router;
