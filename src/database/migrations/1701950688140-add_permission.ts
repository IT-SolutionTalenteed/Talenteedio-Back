import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermission1701950688140 implements MigrationInterface {
    name = 'AddPermission1701950688140';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permission\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`numberOfJobsPerYear\` int NOT NULL, \`numberOfArticlesPerYear\` int NOT NULL, \`validityPeriodOfAJob\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_01b2f778bb8c0fbfdd82769f32\` (\`title\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD \`permissionId\` varchar(36) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` DROP COLUMN \`permissionId\``);
        await queryRunner.query(`DROP TABLE \`permission\``);
    }
}
