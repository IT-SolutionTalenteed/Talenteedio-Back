import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReferredTalentFullName1703141488420 implements MigrationInterface {
    name = 'UpdateReferredTalentFullName1703141488420';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referred\` ADD \`talentFullName\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referred\` DROP COLUMN \`talentFullName\``);
    }
}
