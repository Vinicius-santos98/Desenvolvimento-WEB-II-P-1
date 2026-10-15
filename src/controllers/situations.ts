import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Situations } from '../entity/situations';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields, requireFields } from '../services/validation.service';

const router = Router();

// campos aceitos no corpo da requisição
const FIELDS: (keyof Situations & string)[] = ['nameSituation'];

// Listar todas as situações (paginado)
router.get('/', async (request: Request, response: Response) => {
  try {
    const situationRepository = AppDataSource.getRepository(Situations);

    // recebe a página e o limite de registros pela URL (?page=1&limit=10)
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    // usa o serviço de paginação
    const result = await PaginationService.paginate(situationRepository, page, limit, {
      id: 'DESC',
    });

    return response.status(200).json(result);
  } catch (error) {
    return handleError(response, error, 'Erro ao listar situação');
  }
});

// Visualizar uma situação específica pelo ID
router.get('/view/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const situationRepository = AppDataSource.getRepository(Situations);
    const situation = await situationRepository.findOneBy({ id });

    if (!situation) {
      return response.status(404).json({ message: 'Situação não encontrada' });
    }

    return response.status(200).json(situation);
  } catch (error) {
    return handleError(response, error, 'Erro ao buscar situação');
  }
});

// Cadastrar uma nova situação
router.post('/', async (request: Request, response: Response) => {
  try {
    // aceita apenas os campos permitidos (nunca o id enviado pelo cliente)
    const data = pickFields<Situations>(request.body, FIELDS);

    const missing = requireFields(data, ['nameSituation']);

    if (missing) {
      return response.status(400).json({ message: missing });
    }

    const situationRepository = AppDataSource.getRepository(Situations);
    const newSituation = situationRepository.create(data);

    await situationRepository.save(newSituation);

    return response.status(201).json({
      message: 'Situação cadastrada com sucesso',
      situation: newSituation,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao cadastrar situação');
  }
});

// Atualizar uma situação já cadastrada
router.put('/edit/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const data = pickFields<Situations>(request.body, FIELDS);
    const situationRepository = AppDataSource.getRepository(Situations);
    const situation = await situationRepository.findOneBy({ id });

    if (!situation) {
      return response.status(404).json({ message: 'Situação não encontrada' });
    }

    // atualiza os dados da situação
    situationRepository.merge(situation, data);

    // salva as alterações de dados
    const updateSituation = await situationRepository.save(situation);

    return response.status(200).json({
      message: 'Situação atualizada com sucesso',
      situation: updateSituation,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao atualizar situação');
  }
});

// Remover uma situação cadastrada no banco de dados
router.delete('/delete/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const situationRepository = AppDataSource.getRepository(Situations);
    const situation = await situationRepository.findOneBy({ id });

    if (!situation) {
      return response.status(404).json({ message: 'Situação não encontrada' });
    }

    // remove o registro direto do banco de dados
    await situationRepository.remove(situation);

    return response.status(200).json({ message: 'Situação removida com sucesso' });
  } catch (error) {
    return handleError(response, error, 'Erro ao remover situação');
  }
});

export default router;
