import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRecoverPasswordToUsers1795026578478 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // adiciona a coluna recoverPassword na tabela users: guarda a chave
        // (token) gerada quando o usuário pede para recuperar a senha
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'recoverPassword',
                type: 'varchar',
                length: '255',
                // pode ser nula: só recebe valor quando o usuário pede a recuperação.
                // Por isso, diferente da coluna password, pode ser adicionada
                // mesmo com usuários já cadastrados na tabela
                isNullable: true,
                // cada chave é única (no PostgreSQL, vários NULL não violam o unique)
                isUnique: true,
            }),
        );

        // Na aula (MySQL) a coluna é posicionada depois de "password" com AFTER.
        // O PostgreSQL não tem esse recurso: a coluna nova fica no fim da tabela.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // rollback: remove a coluna
        await queryRunner.dropColumn('users', 'recoverPassword');
    }

}
