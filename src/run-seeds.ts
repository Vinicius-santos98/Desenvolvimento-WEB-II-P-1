import 'reflect-metadata';
import { AppDataSource } from './data-source';
import CreateSituationsSeeds from './seeds/create-situations-seeds';
import CreateUsersSeeds from './seeds/create-users-seeds';
import CreateProductCategoriesSeeds from './seeds/create-product-categories-seeds';
import CreateProductSituationsSeeds from './seeds/create-product-situations-seeds';
import CreateProductsSeeds from './seeds/create-products-seeds';

const runSeed = async function () {
  try {
    console.log('Conectando ao banco de dados...');

    await AppDataSource.initialize();

    console.log('Conectado ao banco de dados!');

    // instância dos seeds
    const situationSeeds = new CreateSituationsSeeds();
    const userSeeds = new CreateUsersSeeds();
    const productCategorySeeds = new CreateProductCategoriesSeeds();
    const productSituationSeeds = new CreateProductSituationsSeeds();
    const productSeeds = new CreateProductsSeeds();

    // executa os seeds
    // a ordem importa por causa das chaves estrangeiras:
    // users depende de situations; products depende de categories e product situations
    await situationSeeds.run(AppDataSource);
    await userSeeds.run(AppDataSource);
    await productCategorySeeds.run(AppDataSource);
    await productSituationSeeds.run(AppDataSource);
    await productSeeds.run(AppDataSource);
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
