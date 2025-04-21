import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillAndJobRelation1688125238476 implements MigrationInterface {
    name = 'AddSkillAndJobRelation1688125238476';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`job_skills_skill\` (\`jobId\` varchar(36) NOT NULL, \`skillId\` varchar(36) NOT NULL, INDEX \`IDX_7f0160506793da667b04476540\` (\`jobId\`), INDEX \`IDX_ae25ea346c558d8cc5bcba6ff6\` (\`skillId\`), PRIMARY KEY (\`jobId\`, \`skillId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`job_skills_skill\` ADD CONSTRAINT \`FK_7f0160506793da667b044765400\` FOREIGN KEY (\`jobId\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`job_skills_skill\` ADD CONSTRAINT \`FK_ae25ea346c558d8cc5bcba6ff6f\` FOREIGN KEY (\`skillId\`) REFERENCES \`skill\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job_skills_skill\` DROP FOREIGN KEY \`FK_ae25ea346c558d8cc5bcba6ff6f\``);
        await queryRunner.query(`ALTER TABLE \`job_skills_skill\` DROP FOREIGN KEY \`FK_7f0160506793da667b044765400\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae25ea346c558d8cc5bcba6ff6\` ON \`job_skills_skill\``);
        await queryRunner.query(`DROP INDEX \`IDX_7f0160506793da667b04476540\` ON \`job_skills_skill\``);
        await queryRunner.query(`DROP TABLE \`job_skills_skill\``);
    }
}
