import 'reflect-metadata';
import { AppDataSource } from './data-source';
import CreateSituationsSeeds from './seeds/create-situations-seeds';

const runSeed = async function () {
  console.log('Conectando ao banco de dados...');

  await AppDataSource.initialize();

  console.log('Conectado ao banco de dados!');

  try {
    // instância dos seeds
    const situationSeeds = new CreateSituationsSeeds();

    // executa os seeds
    await situationSeeds.run(AppDataSource);
  } catch (error) {
    console.error('Erro ao executar as seeds:', error);
  } finally {
    // encerra a conexão com o banco de dados
    await AppDataSource.destroy();
    console.log('Conexão com o banco de dados encerrada.');
  }
};

runSeed();
