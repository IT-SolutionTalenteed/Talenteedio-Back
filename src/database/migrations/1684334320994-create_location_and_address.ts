import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationAndAddress1684334320994 implements MigrationInterface {
    name = 'CreateLocationAndAddress1684334320994';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`address\` (\`id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`location\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT 'public', \`addressId\` varchar(36) NULL, UNIQUE INDEX \`IDX_f0336eb8ccdf8306e270d400cf\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`location\``);
        await queryRunner.query(`DROP TABLE \`address\``);
    }
}
