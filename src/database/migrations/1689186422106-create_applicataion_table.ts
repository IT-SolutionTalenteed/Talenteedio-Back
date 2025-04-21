import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplicataionTable1689186422106 implements MigrationInterface {
    name = 'CreateApplicataionTable1689186422106';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`application\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('in_review', 'validated', 'denied', 'selected', 'hired') NOT NULL DEFAULT 'in_review', \`referral_recomandation\` text NULL, \`jobId\` varchar(36) NOT NULL, \`talentId\` varchar(36) NOT NULL, \`referralId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_dbc0341504212f830211b69ba0c\` FOREIGN KEY (\`jobId\`) REFERENCES \`job\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_6607d283c0cf86d8a4692c985ba\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_227e2c77c3511a5b9e2e88f2f14\` FOREIGN KEY (\`referralId\`) REFERENCES \`referral\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_227e2c77c3511a5b9e2e88f2f14\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_6607d283c0cf86d8a4692c985ba\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_dbc0341504212f830211b69ba0c\``);
        await queryRunner.query(`DROP TABLE \`application\``);
    }
}
