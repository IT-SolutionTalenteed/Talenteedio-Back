import { MigrationInterface, QueryRunner } from 'typeorm';

export class HrFirstClubAddLogo1708964578981 implements MigrationInterface {
    name = 'HrFirstClubAddLogo1708964578981';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` ADD \`logoId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` ADD CONSTRAINT \`FK_37fe8b07bd1c00c3a55d3af7772\` FOREIGN KEY (\`logoId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` DROP CONSTRAINT \`FK_37fe8b07bd1c00c3a55d3af7772\``);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` DROP COLUMN \`logoId\``);
    }
}
