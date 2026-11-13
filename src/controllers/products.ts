import { Router, Request, Response } from 'express';
import { Not } from 'typeorm';
import * as yup from 'yup';
import { AppDataSource } from '../data-source';
import { Products } from '../entity/products';
import { ProductCategories } from '../entity/product-categories';
import { ProductSituations } from '../entity/product-situations';
import { PaginationService } from '../services/pagination.service';
import { handleError } from '../services/error.service';
import { parseId, pickFields } from '../services/validation.service';
import { generateSlug } from '../services/slug.service';

const router = Router();

// campos aceitos no corpo da requisição (o slug não: ele é gerado a partir do nome)
const FIELDS: (keyof Products & string)[] = [
  'name',
  'description',
  'price',
  'productSituationId',
  'productCategoryId',
];

// Regras de validação: cadastro e edição exigem os mesmos campos
const productSchema = yup.object().shape({
  name: yup
    .string()
    .required('O campo nome é obrigatório')
    .min(3, 'O campo nome deve ter no mínimo 3 caracteres')
    .max(255, 'O campo nome deve ter no máximo 255 caracteres'),
  description: yup.string().required('O campo descrição é obrigatório'),
  price: yup
    .number()
    .typeError('O campo preço deve ser um número')
    .required('O campo preço é obrigatório')
    .positive('O campo preço deve ser maior que zero')
    .max(99999999.99, 'O campo preço deve ser no máximo 99.999.999,99'),
  productCategoryId: yup
    .number()
    .typeError('O campo categoria deve ser um número')
    .required('O campo categoria é obrigatório'),
  productSituationId: yup
    .number()
    .typeError('O campo situação do produto deve ser um número')
    .required('O campo situação do produto é obrigatório'),
});

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
    // aceita apenas os campos permitidos (nunca o id nem o slug enviados pelo cliente)
    const data = pickFields<Products>(request.body, FIELDS);

    // valida os dados; abortEarly: false devolve todos os erros de uma vez
    await productSchema.validate(data, { abortEarly: false });

    // gera o slug a partir do nome
    const slug = generateSlug(data.name as string);

    if (!slug) {
      return response
        .status(400)
        .json({ message: 'O nome do produto precisa ter letras ou números' });
    }

    const productRepository = AppDataSource.getRepository(Products);

    // o slug é único: verifica se já existe um produto com ele
    const existingProduct = await productRepository.findOne({ where: { slug } });

    if (existingProduct) {
      return response
        .status(400)
        .json({ message: `Já existe um produto com esse nome (slug "${slug}")` });
    }

    // verifica se a categoria e a situação informadas existem
    const validationError = await validateRelations(data);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const newProduct = productRepository.create({ ...data, slug });

    await productRepository.save(newProduct);

    return response.status(201).json({
      message: 'Produto cadastrado com sucesso',
      product: newProduct,
    });
  } catch (error) {
    // erro de validação do Yup
    if (error instanceof yup.ValidationError) {
      return response.status(400).json({ message: error.errors });
    }

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

    // valida os dados; abortEarly: false devolve todos os erros de uma vez
    await productSchema.validate(data, { abortEarly: false });

    // gera de novo o slug, já que o nome pode ter mudado
    const slug = generateSlug(data.name as string);

    if (!slug) {
      return response
        .status(400)
        .json({ message: 'O nome do produto precisa ter letras ou números' });
    }

    const productRepository = AppDataSource.getRepository(Products);
    const product = await productRepository.findOneBy({ id });

    if (!product) {
      return response.status(404).json({ message: 'Produto não encontrado' });
    }

    // verifica se OUTRO produto já usa esse slug (Not(id) ignora o próprio registro)
    const existingProduct = await productRepository.findOne({
      where: { slug, id: Not(id) },
    });

    if (existingProduct) {
      return response
        .status(400)
        .json({ message: `Já existe um produto com esse nome (slug "${slug}")` });
    }

    // verifica se a categoria e a situação informadas existem
    const validationError = await validateRelations(data);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    // atualiza os dados do produto (com o slug novo)
    productRepository.merge(product, { ...data, slug });

    // salva as alterações de dados
    const updateProduct = await productRepository.save(product);

    return response.status(200).json({
      message: 'Produto atualizado com sucesso',
      product: updateProduct,
    });
  } catch (error) {
    // erro de validação do Yup
    if (error instanceof yup.ValidationError) {
      return response.status(400).json({ message: error.errors });
    }

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
