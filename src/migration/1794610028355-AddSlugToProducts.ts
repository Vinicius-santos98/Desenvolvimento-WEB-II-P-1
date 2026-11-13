import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSlugToProducts1794610028355 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // slug: versão do nome própria para URL (ex.: "Notebook Dell" -> "notebook-dell").
        // Único, para que cada produto tenha um endereço só dele, e obrigatório.
        await queryRunner.addColumn(
            'products',
            new TableColumn({
                name: 'slug',
                type: 'varchar',
                length: '255',
                isUnique: true,
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // dropColumn também remove a constraint UNIQUE da coluna
        await queryRunner.dropColumn('products', 'slug');
    }

}
