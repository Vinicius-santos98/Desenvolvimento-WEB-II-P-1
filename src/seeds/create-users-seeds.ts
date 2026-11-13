import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Users } from '../entity/users';
import { Situations } from '../entity/situations';

export default class CreateUsersSeeds {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando o seed para a tabela users...');

    // obtém os repositórios: usuários e situações (chave estrangeira situationId)
    const userRepository = dataSource.getRepository(Users);
    const situationRepository = dataSource.getRepository(Situations);

    // verifica se já existem registros cadastrados
    const count = await userRepository.count();

    if (count > 0) {
      console.log('A tabela users já possui dados. Nenhuma ação foi realizada.');
      return;
    }

    // todo usuário precisa de uma situação existente: usa a situação 1 (ativo)
    const situation = await situationRepository.findOneBy({ id: 1 });

    if (!situation) {
      console.log(
        'Situação com id 1 não encontrada. Rode o seed de situations antes do de users.',
      );
      return;
    }

    // registros padrão (senha de exemplo "123456", gravada criptografada com custo 10)
    const users = [
      {
        name: 'Usuário Administrador',
        email: 'admin@example.com',
        password: await bcrypt.hash('123456', 10),
        situationId: situation.id,
      },
      {
        name: 'Usuário Teste',
        email: 'teste@example.com',
        password: await bcrypt.hash('123456', 10),
        situationId: situation.id,
      },
    ];

    await userRepository.save(users);

    console.log('Usuários cadastrados com sucesso!');
  }
}
