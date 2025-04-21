import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateModelEnumTypeInCategoryTable1688071190841 implements MigrationInterface {
    name = 'UpdateModelEnumTypeInCategoryTable1688071190841';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_dc11bcf29f835a3a90cb3dc373\` ON \`category\``);
        await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`model\``);
        await queryRunner.query(`ALTER TABLE \`category\` ADD \`model\` enum ('Company', 'Job', 'Talent', 'Job_Talent') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`model\``);
        await queryRunner.query(`ALTER TABLE \`category\` ADD \`model\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_dc11bcf29f835a3a90cb3dc373\` ON \`category\` (\`model\`)`);
    }
}
