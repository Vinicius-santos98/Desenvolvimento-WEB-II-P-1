import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ProductCategories } from '../entity/product-categories';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields, requireFields } from '../services/validation.service';

const router = Router();

// campos aceitos no corpo da requisição
const FIELDS: (keyof ProductCategories & string)[] = ['name'];

// Listar todas as categorias de produto (paginado)
router.get('/', async (request: Request, response: Response) => {
  try {
    const categoryRepository = AppDataSource.getRepository(ProductCategories);

    // recebe a página e o limite de registros pela URL (?page=1&limit=10)
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    // usa o serviço de paginação
    const result = await PaginationService.paginate(categoryRepository, page, limit, {
      id: 'DESC',
    });

    return response.status(200).json(result);
  } catch (error) {
    return handleError(response, error, 'Erro ao listar categoria de produto');
  }
});

// Visualizar uma categoria específica pelo ID
router.get('/view/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const categoryRepository = AppDataSource.getRepository(ProductCategories);
    const category = await categoryRepository.findOneBy({ id });

    if (!category) {
      return response.status(404).json({ message: 'Categoria de produto não encontrada' });
    }

    return response.status(200).json(category);
  } catch (error) {
    return handleError(response, error, 'Erro ao buscar categoria de produto');
  }
});

// Cadastrar uma nova categoria de produto
router.post('/', async (request: Request, response: Response) => {
  try {
    // aceita apenas os campos permitidos (nunca o id enviado pelo cliente)
    const data = pickFields<ProductCategories>(request.body, FIELDS);

    const missing = requireFields(data, ['name']);

    if (missing) {
      return response.status(400).json({ message: missing });
    }

    const categoryRepository = AppDataSource.getRepository(ProductCategories);
    const newCategory = categoryRepository.create(data);

    await categoryRepository.save(newCategory);

    return response.status(201).json({
      message: 'Categoria de produto cadastrada com sucesso',
      productCategory: newCategory,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao cadastrar categoria de produto');
  }
});

// Atualizar uma categoria de produto já cadastrada
router.put('/edit/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const data = pickFields<ProductCategories>(request.body, FIELDS);
    const categoryRepository = AppDataSource.getRepository(ProductCategories);
    const category = await categoryRepository.findOneBy({ id });

    if (!category) {
      return response.status(404).json({ message: 'Categoria de produto não encontrada' });
    }

    // atualiza os dados da categoria
    categoryRepository.merge(category, data);

    // salva as alterações de dados
    const updateCategory = await categoryRepository.save(category);

    return response.status(200).json({
      message: 'Categoria de produto atualizada com sucesso',
      productCategory: updateCategory,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao atualizar categoria de produto');
  }
});

// Remover uma categoria de produto cadastrada no banco de dados
router.delete('/delete/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const categoryRepository = AppDataSource.getRepository(ProductCategories);
    const category = await categoryRepository.findOneBy({ id });

    if (!category) {
      return response.status(404).json({ message: 'Categoria de produto não encontrada' });
    }

    // remove o registro direto do banco de dados
    await categoryRepository.remove(category);

    return response
      .status(200)
      .json({ message: 'Categoria de produto removida com sucesso' });
  } catch (error) {
    return handleError(response, error, 'Erro ao remover categoria de produto');
  }
});

export default router;
