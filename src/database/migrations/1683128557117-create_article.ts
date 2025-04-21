import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticle1683128557117 implements MigrationInterface {
    name = 'CreateArticle1683128557117';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`article\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`content\` varchar(255) NOT NULL, \`status\` enum ('STATUS_1', 'STATUS_2', 'STATUS_3') NOT NULL DEFAULT 'STATUS_1', \`adminId\` varchar(36) NULL, \`recruiterId\` varchar(36) NULL, \`imageId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`article\``);
    }
}
