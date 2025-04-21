import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmailColumnToNullableInContactTable1689704808874 implements MigrationInterface {
    name = 'UpdateEmailColumnToNullableInContactTable1689704808874';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`contact\` CHANGE \`email\` \`email\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`contact\` CHANGE \`email\` \`email\` varchar(255) NOT NULL`);
    }
}
