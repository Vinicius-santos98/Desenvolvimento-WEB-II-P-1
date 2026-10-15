import 'reflect-metadata';
import { AppDataSource } from './data-source';
import CreateSituationsSeeds from './seeds/create-situations-seeds';
import CreateProductCategoriesSeeds from './seeds/create-product-categories-seeds';
import CreateProductSituationsSeeds from './seeds/create-product-situations-seeds';

const runSeed = async function () {
  try {
    console.log('Conectando ao banco de dados...');

    await AppDataSource.initialize();

    console.log('Conectado ao banco de dados!');

    // instância dos seeds
    const situationSeeds = new CreateSituationsSeeds();
    const productCategorySeeds = new CreateProductCategoriesSeeds();
    const productSituationSeeds = new CreateProductSituationsSeeds();

    // executa os seeds
    await situationSeeds.run(AppDataSource);
    await productCategorySeeds.run(AppDataSource);
    await productSituationSeeds.run(AppDataSource);
  } catch (error) {
    console.error('Erro ao executar as seeds:', error);
    process.exitCode = 1;
  } finally {
    // encerra a conexão com o banco de dados (apenas se ela chegou a abrir)
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Conexão com o banco de dados encerrada.');
    }
  }
};

runSeed();
