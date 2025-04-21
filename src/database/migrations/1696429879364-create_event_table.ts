import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventTable1696429879364 implements MigrationInterface {
    name = 'CreateEventTable1696429879364';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`event\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`metaDescription\` text NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', \`date\` date NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`event\``);
    }
}
