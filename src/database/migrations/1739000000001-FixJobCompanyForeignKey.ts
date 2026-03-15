import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixJobCompanyForeignKey1739000000001 implements MigrationInterface {
    name = 'FixJobCompanyForeignKey1739000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Supprimer l'ancienne contrainte
        await queryRunner.query(`
            ALTER TABLE \`job\` 
            DROP FOREIGN KEY \`FK_e66170573cabd565dab1132727d\`
        `);

        // Ajouter la nouvelle contrainte avec CASCADE
        await queryRunner.query(`
            ALTER TABLE \`job\` 
            ADD CONSTRAINT \`FK_e66170573cabd565dab1132727d\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revenir à l'ancienne contrainte
        await queryRunner.query(`
            ALTER TABLE \`job\` 
            DROP FOREIGN KEY \`FK_e66170573cabd565dab1132727d\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`job\` 
            ADD CONSTRAINT \`FK_e66170573cabd565dab1132727d\` 
            FOREIGN KEY (\`companyId\`) 
            REFERENCES \`company\`(\`id\`) 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }
}