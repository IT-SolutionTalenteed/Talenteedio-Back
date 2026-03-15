import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCompanyForeignKeys1739000000002 implements MigrationInterface {
    name = 'FixCompanyForeignKeys1739000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Corriger la contrainte Event -> Company (SET NULL car nullable)
        await queryRunner.query(`
            ALTER TABLE \`event\` 
            DROP FOREIGN KEY \`FK_event_company\`
        `).catch(() => {
            // La contrainte pourrait ne pas exister ou avoir un nom différent
            console.log('Event company constraint not found or already correct');
        });

        await queryRunner.query(`
            ALTER TABLE \`event\` 
            ADD CONSTRAINT \`FK_event_company\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `).catch(() => {
            console.log('Event company constraint already exists or column not found');
        });

        // Corriger la contrainte Article -> Company (CASCADE)
        await queryRunner.query(`
            ALTER TABLE \`article\` 
            DROP FOREIGN KEY \`FK_article_company\`
        `).catch(() => {
            // La contrainte pourrait ne pas exister ou avoir un nom différent
            console.log('Article company constraint not found or already correct');
        });

        await queryRunner.query(`
            ALTER TABLE \`article\` 
            ADD CONSTRAINT \`FK_article_company\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `).catch(() => {
            console.log('Article company constraint already exists or column not found');
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revenir aux anciennes contraintes
        await queryRunner.query(`
            ALTER TABLE \`event\` 
            DROP FOREIGN KEY \`FK_event_company\`
        `).catch(() => {});

        await queryRunner.query(`
            ALTER TABLE \`event\` 
            ADD CONSTRAINT \`FK_event_company\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `).catch(() => {});

        await queryRunner.query(`
            ALTER TABLE \`article\` 
            DROP FOREIGN KEY \`FK_article_company\`
        `).catch(() => {});

        await queryRunner.query(`
            ALTER TABLE \`article\` 
            ADD CONSTRAINT \`FK_article_company\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `).catch(() => {});
    }
}