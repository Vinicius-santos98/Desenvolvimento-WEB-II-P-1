import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Products } from '../entity/products';
import { ProductCategories } from '../entity/product-categories';
import { ProductSituations } from '../entity/product-situations';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields, requireFields } from '../services/validation.service';

const router = Router();

// campos aceitos no corpo da requisição
const FIELDS: (keyof Products & string)[] = [
  'name',
  'productSituationId',
  'productCategoryId',
];

// Valida se a categoria e a situação informadas existem no banco de dados
async function validateRelations(data: any): Promise<string | null> {
  if (data.productCategoryId !== undefined) {
    const categoryId = parseId(data.productCategoryId);

    if (categoryId === null) {
      return 'productCategoryId deve ser um número inteiro positivo';
    }

    const categoryRepository = AppDataSource.getRepository(ProductCategories);
    const category = await categoryRepository.findOneBy({ id: categoryId });

    if (!category) {
      return 'Categoria de produto informada não existe';
    }
  }

  if (data.productSituationId !== undefined) {
    const productSituationId = parseId(data.productSituationId);

    if (productSituationId === null) {
      return 'productSituationId deve ser um número inteiro positivo';
    }

    const productSituationRepository = AppDataSource.getRepository(ProductSituations);
    const productSituation = await productSituationRepository.findOneBy({
      id: productSituationId,
    });

    if (!productSituation) {
      return 'Situação de produto informada não existe';
    }
  }

  return null;
}

// Listar todos os produtos (paginado)
router.get('/', async (request: Request, response: Response) => {
  try {
    const productRepository = AppDataSource.getRepository(Products);

    // recebe a página e o limite de registros pela URL (?page=1&limit=10)
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    // usa o serviço de paginação
    const result = await PaginationService.paginate(productRepository, page, limit, {
      id: 'DESC',
    });

    return response.status(200).json(result);
  } catch (error) {
    return handleError(response, error, 'Erro ao listar produto');
  }
});

// Visualizar um produto específico pelo ID (com categoria e situação relacionadas)
router.get('/view/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const productRepository = AppDataSource.getRepository(Products);
    const product = await productRepository.findOne({
      where: { id },
      relations: { productCategory: true, productSituation: true },
    });

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado' });
    }

    return response.status(200).json(product);
  } catch (error) {
    return handleError(response, error, 'Erro ao buscar produto');
  }
});

// Cadastrar um novo produto
router.post('/', async (request: Request, response: Response) => {
  try {
    // aceita apenas os campos permitidos (nunca o id enviado pelo cliente)
    const data = pickFields<Products>(request.body, FIELDS);

    const missing = requireFields(data, [
      'name',
      'productCategoryId',
      'productSituationId',
    ]);

    if (missing) {
      return response.status(400).json({ message: missing });
    }

    // verifica se a categoria e a situação informadas existem
    const validationError = await validateRelations(data);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const productRepository = AppDataSource.getRepository(Products);
    const newProduct = productRepository.create(data);

    await productRepository.save(newProduct);

    return response.status(201).json({
      message: 'Produto cadastrado com sucesso',
      product: newProduct,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao cadastrar produto');
  }
});

// Atualizar um produto já cadastrado
router.put('/edit/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const data = pickFields<Products>(request.body, FIELDS);
    const productRepository = AppDataSource.getRepository(Products);
    const product = await productRepository.findOneBy({ id });

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado' });
    }

    // se a categoria ou a situação forem alteradas, verifica se existem
    const validationError = await validateRelations(data);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    // atualiza os dados do produto
    productRepository.merge(product, data);

    // salva as alterações de dados
    const updateProduct = await productRepository.save(product);

    return response.status(200).json({
      message: 'Produto atualizado com sucesso',
      product: updateProduct,
    });
  } catch (error) {
    return handleError(response, error, 'Erro ao atualizar produto');
  }
});

// Remover um produto cadastrado no banco de dados
router.delete('/delete/:id', async (request: Request, response: Response) => {
  try {
    const id = parseId(request.params.id);

    if (id === null) {
      return response.status(400).json({ message: 'ID inválido' });
    }

    const productRepository = AppDataSource.getRepository(Products);
    const product = await productRepository.findOneBy({ id });

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado' });
    }

    // remove o registro direto do banco de dados
    await productRepository.remove(product);

    return response.status(200).json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    return handleError(response, error, 'Erro ao remover produto');
  }
});

export default router;
