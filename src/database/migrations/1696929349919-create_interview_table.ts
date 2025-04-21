import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterviewTable1696929349919 implements MigrationInterface {
    name = 'CreateInterviewTable1696929349919';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`interview\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`metaDescription\` text NULL, \`videoSrc\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', \`guests\` json NOT NULL, \`date\` date NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`adminId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`interview\` ADD CONSTRAINT \`FK_dc558e1893098c98fb9b340c9ad\` FOREIGN KEY (\`adminId\`) REFERENCES \`admin\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`interview\` DROP FOREIGN KEY \`FK_dc558e1893098c98fb9b340c9ad\``);
        await queryRunner.query(`DROP TABLE \`interview\``);
    }
}
