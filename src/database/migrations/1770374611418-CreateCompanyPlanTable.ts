import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyPlanTable1770374611418 implements MigrationInterface {
    name = 'CreateCompanyPlanTable1770374611418';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`company_plan\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NOT NULL,
                \`features\` text NULL,
                \`maxArticles\` int NOT NULL DEFAULT 0,
                \`maxEvents\` int NOT NULL DEFAULT 0,
                \`maxJobs\` int NOT NULL DEFAULT 0,
                \`price\` decimal(10,2) NOT NULL,
                \`billingPeriod\` varchar(255) NOT NULL DEFAULT 'month',
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`displayOrder\` int NOT NULL DEFAULT 0,
                \`isPopular\` tinyint NOT NULL DEFAULT 0,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`company_plan\``);
    }
}
