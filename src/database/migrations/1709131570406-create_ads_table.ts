import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdsTable1709131570406 implements MigrationInterface {
    name = 'CreateAdsTable1709131570406';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ad\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`status\` enum ('enable', 'disable') NOT NULL DEFAULT 'disable', \`link\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`imageId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ad\` ADD CONSTRAINT \`FK_963499ba1ce6fa3ad98bfa4def1\` FOREIGN KEY (\`imageId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ad\` DROP FOREIGN KEY \`FK_963499ba1ce6fa3ad98bfa4def1\``);
        await queryRunner.query(`DROP TABLE \`ad\``);
    }
}
