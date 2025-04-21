import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToTalentTable1688993482342 implements MigrationInterface {
    name = 'AddCategoryToTalentTable1688993482342';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`categoryId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_b4d3cc3e9764663efc51f02b800\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_b4d3cc3e9764663efc51f02b800\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`categoryId\``);
    }
}
