import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartnerTable1696436981485 implements MigrationInterface {
    name = 'CreatePartnerTable1696436981485';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`partner\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`imageId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`partner\` ADD CONSTRAINT \`FK_adb3f6da13d1808c66f4cf04d2d\` FOREIGN KEY (\`imageId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`partner\` DROP FOREIGN KEY \`FK_adb3f6da13d1808c66f4cf04d2d\``);
        await queryRunner.query(`DROP TABLE \`partner\``);
    }
}
