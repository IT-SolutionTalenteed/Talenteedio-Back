import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHeaderTextContentToSettingTable1697641796684 implements MigrationInterface {
    name = 'AddHeaderTextContentToSettingTable1697641796684';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` ADD \`headerText\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`headerText\``);
    }
}
