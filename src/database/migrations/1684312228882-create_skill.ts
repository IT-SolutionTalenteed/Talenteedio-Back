import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkill1684312228882 implements MigrationInterface {
    name = 'CreateSkill1684312228882';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`skill\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('public', 'daft', 'blocked') NOT NULL DEFAULT 'public', UNIQUE INDEX \`IDX_0f49a593960360f6f85b692aca\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`skill\``);
    }
}
