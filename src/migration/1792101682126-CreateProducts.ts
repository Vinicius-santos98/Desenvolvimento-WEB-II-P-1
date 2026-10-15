import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateProducts1792101682126 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'products',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'productSituationId',
                        type: 'int',
                    },
                    {
                        name: 'productCategoryId',
                        type: 'int',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
        );

        // Criar chave estrangeira para product_situations
        await queryRunner.createForeignKey(
            'products',
            new TableForeignKey({
                columnNames: ['productSituationId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'product_situations',
                onDelete: 'CASCADE',
            }),
        );

        // Criar chave estrangeira para product_categories
        await queryRunner.createForeignKey(
            'products',
            new TableForeignKey({
                columnNames: ['productCategoryId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'product_categories',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('products');

        const situationForeignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('productSituationId') !== -1,
        );

        if (situationForeignKey) {
            await queryRunner.dropForeignKey('products', situationForeignKey);
        }

        const categoryForeignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('productCategoryId') !== -1,
        );

        if (categoryForeignKey) {
            await queryRunner.dropForeignKey('products', categoryForeignKey);
        }

        await queryRunner.dropTable('products');
    }

}
