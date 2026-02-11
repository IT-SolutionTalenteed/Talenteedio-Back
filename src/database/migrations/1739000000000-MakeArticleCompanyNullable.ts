import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeArticleCompanyNullable1739000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the foreign key constraint first
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            DROP FOREIGN KEY IF EXISTS \`FK_article_company\`
        `);

        // Set invalid companyId to NULL (where companyId doesn't exist in company table)
        await queryRunner.query(`
            UPDATE \`article\` 
            SET \`companyId\` = NULL 
            WHERE \`companyId\` IS NOT NULL 
            AND \`companyId\` NOT IN (SELECT \`id\` FROM \`company\`)
        `);

        // Make the companyId column nullable
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            MODIFY COLUMN \`companyId\` varchar(36) NULL
        `);

        // Re-add the foreign key constraint with CASCADE on delete
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            ADD CONSTRAINT \`FK_article_company\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the foreign key constraint
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            DROP FOREIGN KEY \`FK_article_company\`
        `);

        // Delete articles without valid company
        await queryRunner.query(`
            DELETE FROM \`article\` 
            WHERE \`companyId\` IS NULL
        `);

        // Make the companyId column NOT NULL again
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            MODIFY COLUMN \`companyId\` varchar(36) NOT NULL
        `);

        // Re-add the foreign key constraint
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            ADD CONSTRAINT \`FK_article_company\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }
}
