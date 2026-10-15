import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ProductSituations } from '../entity/product-situations';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields, requireFields } from '../services/validation.service';

const router = Router();

// campos aceitos no corpo da requisição
const FIELDS: (keyof ProductSituations & string)[] = ['name'];

// Listar todas as situações de produto (paginado)
router.get('/', async (request: Request, response: Response) => {
  try {
    const productSituationRepository = AppDataSource.getRepository(ProductSituations);

    // recebe a página e o limite de registros pela URL (?page=1&limit=10)
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    // usa o serviço de paginação
    const result = await PaginationService.paginate(
      productSituationRepository,
      page,
      limit,
      { id: 'DESC' },
    );

    return response.status(200).json(result);
  } catch (error) {
    return handleError(response, error, 'Erro ao listar situação de produto');
  }
});

// Visualizar uma situação de produto específica pelo ID
router.get('/view/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const productSituationRepository = AppDataSource.getRepository(ProductSituations);
    const productSituation = await productSituationRepository.findOneBy({ id });

    if (!productSituation) {
      return response.status(404).json({ message: 'Situação de produto não encontrada' });
    }

    return response.status(200).json(productSituation);
  } catch (error) {
    return handleError(response, error, 'Erro ao buscar situação de produto');
  }
});

// Cadastrar uma nova situação de produto
router.post('/', async (request: Request, response: Response) => {
  try {
    // aceita apenas os campos permitidos (nunca o id enviado pelo cliente)
    const data = pickFields<ProductSituations>(request.body, FIELDS);

    const missing = requireFields(data, ['name']);

    if (missing) {
      return response.status(400).json({ message: missing });
    }

    const productSituationRepository = AppDataSource.getRepository(ProductSituations);
    const newProductSituation = productSituationRepository.create(data);

    await productSituationRepository.save(newProductSituation);

    return response.status(201).json({
      message: 'Situação de produto cadastrada com sucesso',
      productSituation: newProductSituation,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao cadastrar situação de produto');
  }
});

// Atualizar uma situação de produto já cadastrada
router.put('/edit/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const data = pickFields<ProductSituations>(request.body, FIELDS);
    const productSituationRepository = AppDataSource.getRepository(ProductSituations);
    const productSituation = await productSituationRepository.findOneBy({ id });

    if (!productSituation) {
      return response.status(404).json({ message: 'Situação de produto não encontrada' });
    }

    // atualiza os dados da situação de produto
    productSituationRepository.merge(productSituation, data);

    // salva as alterações de dados
    const updateProductSituation =
      await productSituationRepository.save(productSituation);

    return response.status(200).json({
      message: 'Situação de produto atualizada com sucesso',
      productSituation: updateProductSituation,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao atualizar situação de produto');
  }
});

// Remover uma situação de produto cadastrada no banco de dados
router.delete('/delete/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const productSituationRepository = AppDataSource.getRepository(ProductSituations);
    const productSituation = await productSituationRepository.findOneBy({ id });

    if (!productSituation) {
      return response.status(404).json({ message: 'Situação de produto não encontrada' });
    }

    // remove o registro direto do banco de dados
    await productSituationRepository.remove(productSituation);

    return response
      .status(200)
      .json({ message: 'Situação de produto removida com sucesso' });
  } catch (error) {
    return handleError(response, error, 'Erro ao remover situação de produto');
  }
});

export default router;
