import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDescriptionAndPriceToProducts1794610030860 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('products', [
            // text: descrições de produto costumam passar de 255 caracteres
            new TableColumn({
                name: 'description',
                type: 'text',
                isNullable: false,
            }),
            // decimal(10,2): valor exato com 2 casas (até 99.999.999,99),
            // sem os erros de arredondamento de float em valores monetários
            new TableColumn({
                name: 'price',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: false,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('products', ['description', 'price']);
    }

}
