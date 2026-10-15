import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Users } from '../entity/users';
import { Situations } from '../entity/situations';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields, requireFields } from '../services/validation.service';

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

// Listar todos os usuários (paginado)
router.get('/', async (request: Request, response: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(Users);

    // recebe a página e o limite de registros pela URL (?page=1&limit=10)
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
router.get('/view/:id', async (request: Request, response: Response) => {
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
router.post('/', async (request: Request, response: Response) => {
  try {
    // aceita apenas os campos permitidos (nunca o id enviado pelo cliente)
    const data = pickFields<Users>(request.body, FIELDS);

    const missing = requireFields(data, ['name', 'email', 'situationId']);

    if (missing) {
      return response.status(400).json({ message: missing });
    }

    // verifica se a situação informada existe
    const situationError = await validateSituation(data.situationId);

    if (situationError) {
      return response.status(400).json({ message: situationError });
    }

    const userRepository = AppDataSource.getRepository(Users);
    const newUser = userRepository.create(data);

    await userRepository.save(newUser);

    return response.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      user: newUser,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao cadastrar usuário');
  }
});

// Atualizar um usuário já cadastrado
router.put('/edit/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const data = pickFields<Users>(request.body, FIELDS);
    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' });
    }

    // se a situação for alterada, verifica se ela existe
    if (data.situationId !== undefined) {
      const situationError = await validateSituation(data.situationId);

      if (situationError) {
        return response.status(400).json({ message: situationError });
      }
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
    return handleError(response, error, 'Erro ao atualizar usuário');
  }
});

// Remover um usuário cadastrado no banco de dados
router.delete('/delete/:id', async (request: Request, response: Response) => {
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
