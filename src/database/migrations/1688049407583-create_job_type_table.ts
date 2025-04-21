import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobTypeTable1688049407583 implements MigrationInterface {
    name = 'CreateJobTypeTable1688049407583';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`job_type\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT 'public', UNIQUE INDEX \`IDX_254c861f4f13ab1012fd32bb61\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_254c861f4f13ab1012fd32bb61\` ON \`job_type\``);
        await queryRunner.query(`DROP TABLE \`job_type\``);
    }
}
