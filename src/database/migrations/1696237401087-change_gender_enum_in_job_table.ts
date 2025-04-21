import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeGenderEnumInJobTable1696237401087 implements MigrationInterface {
    name = 'ChangeGenderEnumInJobTable1696237401087';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`gender\``);
        await queryRunner.query(`ALTER TABLE \`job\` ADD \`gender\` enum ('M/F/X', 'M/W/D') NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` CHANGE \`gender\` \`gender\` enum ('male', 'female', 'other') NULL`);
    }
}
