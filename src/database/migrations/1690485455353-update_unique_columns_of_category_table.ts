import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUniqueColumnsOfCategoryTable1690485455353 implements MigrationInterface {
    name = 'UpdateUniqueColumnsOfCategoryTable1690485455353';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_4e080ab7c5976fbb8633ee27bc\` ON \`category\` (\`slug\`, \`model\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_4e080ab7c5976fbb8633ee27bc\` ON \`category\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_cb73208f151aa71cdd78f662d7\` ON \`category\` (\`slug\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\` (\`name\`)`);
    }
}
