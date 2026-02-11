import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultToPublicContent1739200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add default value to publicContent column
        await queryRunner.query(`
            ALTER TABLE article 
            MODIFY COLUMN publicContent TEXT DEFAULT ''
        `);
        
        // Update existing NULL values to empty string
        await queryRunner.query(`
            UPDATE article 
            SET publicContent = '' 
            WHERE publicContent IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove default value
        await queryRunner.query(`
            ALTER TABLE article 
            MODIFY COLUMN publicContent TEXT DEFAULT NULL
        `);
    }
}
