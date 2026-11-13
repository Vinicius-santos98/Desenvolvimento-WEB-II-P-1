import { DataSource, In } from 'typeorm';
import { Products } from '../entity/products';
import { ProductCategories } from '../entity/product-categories';
import { ProductSituations } from '../entity/product-situations';
import { generateSlug } from '../services/slug.service';

export default class CreateProductsSeeds {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando o seed para a tabela products...');

    const productRepository = dataSource.getRepository(Products);
    const categoryRepository = dataSource.getRepository(ProductCategories);
    const productSituationRepository = dataSource.getRepository(ProductSituations);

    // verifica se já existem registros cadastrados
    const count = await productRepository.count();

    if (count > 0) {
      console.log('A tabela products já possui dados. Nenhuma ação foi realizada.');
      return;
    }

    // os produtos dependem das categorias 1-4 e das situações de produto 1-2
    // (chaves estrangeiras), criadas pelos seeds anteriores
    const categories = await categoryRepository.countBy({ id: In([1, 2, 3, 4]) });
    const productSituations = await productSituationRepository.countBy({ id: In([1, 2]) });

    if (categories < 4 || productSituations < 2) {
      console.log(
        'Categorias ou situações de produto não encontradas. Rode os seeds de product_categories e product_situations antes do de products.',
      );
      return;
    }

    // registros padrão
    const products = [
      {
        name: 'Smartphone Galaxy A55',
        description: 'Smartphone com tela de 6,6 polegadas, 128 GB de armazenamento e câmera tripla.',
        price: 2199.9,
        productCategoryId: 1, // eletrônicos
        productSituationId: 1, // disponível
      },
      {
        name: 'Camiseta Básica Algodão',
        description: 'Camiseta de algodão 100%, gola redonda, disponível em várias cores.',
        price: 59.9,
        productCategoryId: 2, // vestuário
        productSituationId: 1, // disponível
      },
      {
        name: 'Café Torrado e Moído 500g',
        description: 'Café 100% arábica, torra média, pacote de 500 gramas.',
        price: 24.9,
        productCategoryId: 3, // alimentos
        productSituationId: 1, // disponível
      },
      {
        name: 'Livro Clean Code',
        description: 'Clássico sobre boas práticas de escrita de código limpo e legível.',
        price: 89.9,
        productCategoryId: 4, // livros
        productSituationId: 2, // esgotado
      },
    ];

    // o slug de cada produto é gerado a partir do nome, com a mesma regra da API
    await productRepository.save(
      products.map((product) => ({ ...product, slug: generateSlug(product.name) })),
    );

    console.log('Produtos cadastrados com sucesso!');
  }
}
