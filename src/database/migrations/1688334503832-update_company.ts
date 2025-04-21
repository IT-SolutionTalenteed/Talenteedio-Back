import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCompany1688334503832 implements MigrationInterface {
    name = 'UpdateCompany1688334503832';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`company_name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`contactId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD UNIQUE INDEX \`IDX_eaf0aee7b466ed67f506c8ddf2\` (\`contactId\`)`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`logoId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`categoryId\` varchar(36) NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_eaf0aee7b466ed67f506c8ddf2\` ON \`company\` (\`contactId\`)`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_eaf0aee7b466ed67f506c8ddf2b\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_1b087964cd9a3453bef7e178cce\` FOREIGN KEY (\`logoId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_4b47f280258a2e73f5c44497e83\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_4b47f280258a2e73f5c44497e83\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_1b087964cd9a3453bef7e178cce\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_eaf0aee7b466ed67f506c8ddf2b\``);
        await queryRunner.query(`DROP INDEX \`REL_eaf0aee7b466ed67f506c8ddf2\` ON \`company\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`categoryId\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`logoId\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP INDEX \`IDX_eaf0aee7b466ed67f506c8ddf2\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`contactId\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`company_name\``);
    }
}
