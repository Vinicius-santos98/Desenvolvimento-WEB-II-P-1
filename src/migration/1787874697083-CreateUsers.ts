import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateUsers1787874697083 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
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
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'created',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'situation_id',
                        type: 'int',
                    },
                ],
            }),
        );

        // Criar chave estrangeira
        await queryRunner.createForeignKey(
            'users',
            new TableForeignKey({
                columnNames: ['situation_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'situations',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('users');
        const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('situation_id') !== -1,
        );

        if (foreignKey) {
            await queryRunner.dropForeignKey('users', foreignKey);
        }

        await queryRunner.dropTable('users');
    }

}
