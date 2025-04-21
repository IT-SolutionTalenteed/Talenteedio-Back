import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1688055979438 implements MigrationInterface {
    name = 'CreateCategoryTable1688055979438';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked') NOT NULL DEFAULT 'public', \`model\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`), UNIQUE INDEX \`IDX_cb73208f151aa71cdd78f662d7\` (\`slug\`), UNIQUE INDEX \`IDX_dc11bcf29f835a3a90cb3dc373\` (\`model\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_dc11bcf29f835a3a90cb3dc373\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
    }
}
