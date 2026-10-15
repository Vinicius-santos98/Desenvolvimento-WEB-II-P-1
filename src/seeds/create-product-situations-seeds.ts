import { DataSource } from 'typeorm';
import { ProductSituations } from '../entity/product-situations';

export default class CreateProductSituationsSeeds {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando o seed para a tabela product_situations...');

    // obtém o repositório da entidade
    const productSituationRepository = dataSource.getRepository(ProductSituations);

    // verifica se já existem registros cadastrados
    const count = await productSituationRepository.count();

    if (count > 0) {
      console.log(
        'A tabela product_situations já possui dados. Nenhuma ação foi realizada.',
      );
      return;
    }

    // registros padrão
    const productSituations = [
      { name: 'disponível' },
      { name: 'esgotado' },
      { name: 'descontinuado' },
    ];

    await productSituationRepository.save(productSituations);

    console.log('Situações de produto cadastradas com sucesso!');
  }
}
