import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinkToPartnerTable1697642106372 implements MigrationInterface {
    name = 'AddLinkToPartnerTable1697642106372';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`partner\` ADD \`link\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`partner\` DROP COLUMN \`link\``);
    }
}
