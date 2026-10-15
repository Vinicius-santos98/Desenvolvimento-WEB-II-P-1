import { DataSource } from 'typeorm';
import { ProductCategories } from '../entity/product-categories';

export default class CreateProductCategoriesSeeds {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando o seed para a tabela product_categories...');

    // obtém o repositório da entidade
    const categoryRepository = dataSource.getRepository(ProductCategories);

    // verifica se já existem registros cadastrados
    const count = await categoryRepository.count();

    if (count > 0) {
      console.log(
        'A tabela product_categories já possui dados. Nenhuma ação foi realizada.',
      );
      return;
    }

    // registros padrão
    const categories = [
      { name: 'eletrônicos' },
      { name: 'vestuário' },
      { name: 'alimentos' },
      { name: 'livros' },
    ];

    await categoryRepository.save(categories);

    console.log('Categorias de produto cadastradas com sucesso!');
  }
}
