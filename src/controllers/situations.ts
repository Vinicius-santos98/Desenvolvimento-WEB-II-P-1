import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Situations } from '../entity/situations';
import { PaginationService } from '../services/pagination.service';

const router = Router();

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
    return response.status(500).json({
      message: 'Erro ao listar situação',
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Visualizar uma situação específica pelo ID
router.get('/view/:id', async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);
    const situationRepository = AppDataSource.getRepository(Situations);
    const situation = await situationRepository.findOneBy({ id: parseInt(id) });

    if (!situation) {
      return response.status(404).json({ message: 'Situação não encontrada' });
    }

    return response.status(200).json(situation);
  } catch (error) {
    return response.status(500).json({ message: 'Erro ao buscar situação', error });
  }
});

// Cadastrar uma nova situação
router.post('/', async (request: Request, response: Response) => {
  try {
    const data = request.body;
    const situationRepository = AppDataSource.getRepository(Situations);
    const newSituation = situationRepository.create(data);

    await situationRepository.save(newSituation);

    return response.status(201).json({
      message: 'Situação cadastrada com sucesso',
      situation: newSituation,
    });
  } catch (error) {
    return response.status(500).json({ message: 'Erro ao cadastrar situação', error });
  }
});

// Atualizar uma situação já cadastrada
router.put('/edit/:id', async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);
    const data = request.body;
    const situationRepository = AppDataSource.getRepository(Situations);
    const situation = await situationRepository.findOneBy({ id: parseInt(id) });

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
    return response.status(500).json({ message: 'Erro ao atualizar situação', error });
  }
});

// Remover uma situação cadastrada no banco de dados
router.delete('/delete/:id', async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);
    const situationRepository = AppDataSource.getRepository(Situations);
    const situation = await situationRepository.findOneBy({ id: parseInt(id) });

    if (!situation) {
      return response.status(404).json({ message: 'Situação não encontrada' });
    }

    // remove o registro direto do banco de dados
    await situationRepository.remove(situation);

    return response.status(200).json({ message: 'Situação removida com sucesso' });
  } catch (error) {
    return response.status(500).json({ message: 'Erro ao remover situação', error });
  }
});

export default router;
