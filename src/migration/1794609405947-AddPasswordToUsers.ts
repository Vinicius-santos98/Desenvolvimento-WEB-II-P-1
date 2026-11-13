import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPasswordToUsers1794609405947 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // adiciona a coluna password na tabela users (obrigatória, nunca nula)
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'password',
                type: 'varchar',
                length: '255',
                isNullable: false,
            }),
        );

        // No MySQL a aula reposiciona a coluna logo depois de "email" com
        // ALTER TABLE users MODIFY COLUMN password VARCHAR(255) AFTER email.
        // O PostgreSQL não tem esse recurso: colunas novas sempre ficam no fim
        // da tabela, o que não afeta as consultas (elas usam o nome da coluna).
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // desfaz a alteração removendo a coluna
        await queryRunner.dropColumn('users', 'password');
    }

}
