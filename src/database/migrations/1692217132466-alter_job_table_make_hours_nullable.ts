import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterJobTableMakeHoursNullable1692217132466 implements MigrationInterface {
    name = 'AlterJobTableMakeHoursNullable1692217132466';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`hours\` \`hours\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`hours\` \`hours\` int NOT NULL`);
    }
}
