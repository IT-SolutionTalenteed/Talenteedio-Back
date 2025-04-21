import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagesToSetting1710265778502 implements MigrationInterface {
    name = 'AddImagesToSetting1710265778502';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`homeImage1Id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`homeImage2Id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`homeImage3Id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_3a14a49e1c0348c7872485ab2d1\` FOREIGN KEY (\`homeImage1Id\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_ef97053f9b8d6754ce536ec969c\` FOREIGN KEY (\`homeImage2Id\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_f21971222b9b8e38f6e9fc74b38\` FOREIGN KEY (\`homeImage3Id\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_f21971222b9b8e38f6e9fc74b38\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_ef97053f9b8d6754ce536ec969c\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_3a14a49e1c0348c7872485ab2d1\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`homeImage3Id\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`homeImage2Id\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`homeImage1Id\``);
    }
}
