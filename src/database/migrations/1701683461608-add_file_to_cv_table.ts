import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileToCvTable1701683461608 implements MigrationInterface {
    name = 'AddFileToCvTable1701683461608';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`fileId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`languages\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`languages\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`diplomas\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`diplomas\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`experiences\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`experiences\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD CONSTRAINT \`FK_7cdd2adb41fd532fdca39cba014\` FOREIGN KEY (\`fileId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv\` DROP FOREIGN KEY \`FK_7cdd2adb41fd532fdca39cba014\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`experiences\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`experiences\` longtext CHARACTER SET "utf8mb4" COLLATE "utf8mb4_bin" NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`diplomas\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`diplomas\` longtext CHARACTER SET "utf8mb4" COLLATE "utf8mb4_bin" NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`languages\``);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`languages\` longtext CHARACTER SET "utf8mb4" COLLATE "utf8mb4_bin" NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` CHANGE \`description\` \`description\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`fileId\``);
    }
}
