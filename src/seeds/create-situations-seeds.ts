import { DataSource } from 'typeorm';
import { Situations } from '../entity/situations';

export default class CreateSituationsSeeds {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando o seed para a tabela situations...');

    // obtém o repositório da entidade
    const situationRepository = dataSource.getRepository(Situations);

    // verifica se já existem registros cadastrados
    const count = await situationRepository.count();

    if (count > 0) {
      console.log('A tabela situations já possui dados. Nenhuma ação foi realizada.');
      return;
    }

    // registros padrão
    const situations = [
      { name_situation: 'ativo' },
      { name_situation: 'inativo' },
      { name_situation: 'pendente' },
    ];

    await situationRepository.save(situations);

    console.log('Situações cadastradas com sucesso!');
  }
}
