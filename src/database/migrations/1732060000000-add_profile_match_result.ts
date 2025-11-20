import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileMatchResult1732060000000 implements MigrationInterface {
    name = 'AddProfileMatchResult1732060000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create profile_match_result table
        await queryRunner.query(`
            CREATE TABLE \`profile_match_result\` (
                \`id\` varchar(36) NOT NULL,
                \`cvId\` varchar(36) NOT NULL,
                \`jobId\` varchar(36) NOT NULL,
                \`cvText\` text NOT NULL,
                \`jobText\` text NOT NULL,
                \`pythonReturn\` json NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_profile_match_cv_job\` (\`cvId\`, \`jobId\`),
                CONSTRAINT \`FK_profile_match_cv\` FOREIGN KEY (\`cvId\`) REFERENCES \`cv\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT \`FK_profile_match_job\` FOREIGN KEY (\`jobId\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);

        // Add profileMatchResult relation to application table
        await queryRunner.query(`
            ALTER TABLE \`application\` 
            ADD \`profileMatchResultId\` varchar(36) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE \`application\` 
            ADD CONSTRAINT \`FK_application_profile_match\` 
            FOREIGN KEY (\`profileMatchResultId\`) 
            REFERENCES \`profile_match_result\`(\`id\`) 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key from application table
        await queryRunner.query(`
            ALTER TABLE \`application\` 
            DROP FOREIGN KEY \`FK_application_profile_match\`
        `);

        // Remove column from application table
        await queryRunner.query(`
            ALTER TABLE \`application\` 
            DROP COLUMN \`profileMatchResultId\`
        `);

        // Drop profile_match_result table
        await queryRunner.query(`DROP TABLE \`profile_match_result\``);
    }
}
