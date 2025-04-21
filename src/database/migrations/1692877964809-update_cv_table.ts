import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCvTable1692877964809 implements MigrationInterface {
    name = 'UpdateCvTable1692877964809';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cv_skills_skill\` (\`cvId\` varchar(36) NOT NULL, \`skillId\` varchar(36) NOT NULL, INDEX \`IDX_5adf1336ce64eb1b5e0ed23bea\` (\`cvId\`), INDEX \`IDX_078a4872121f8b4f6e66522170\` (\`skillId\`), PRIMARY KEY (\`cvId\`, \`skillId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`data\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`description\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`languages\` json NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`diplomas\` json NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`experiences\` json NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv_skills_skill\` ADD CONSTRAINT \`FK_5adf1336ce64eb1b5e0ed23bea6\` FOREIGN KEY (\`cvId\`) REFERENCES \`cv\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`cv_skills_skill\` ADD CONSTRAINT \`FK_078a4872121f8b4f6e665221706\` FOREIGN KEY (\`skillId\`) REFERENCES \`skill\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv_skills_skill\` DROP FOREIGN KEY \`FK_078a4872121f8b4f6e665221706\``);
        await queryRunner.query(`ALTER TABLE \`cv_skills_skill\` DROP FOREIGN KEY \`FK_5adf1336ce64eb1b5e0ed23bea6\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`experiences\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`diplomas\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`languages\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`data\` longtext CHARACTER SET "utf8mb4" COLLATE "utf8mb4_bin" NOT NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_078a4872121f8b4f6e66522170\` ON \`cv_skills_skill\``);
        await queryRunner.query(`DROP INDEX \`IDX_5adf1336ce64eb1b5e0ed23bea\` ON \`cv_skills_skill\``);
        await queryRunner.query(`DROP TABLE \`cv_skills_skill\``);
    }
}
