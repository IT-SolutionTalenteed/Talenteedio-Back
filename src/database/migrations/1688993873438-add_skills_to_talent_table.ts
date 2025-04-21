import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillsToTalentTable1688993873438 implements MigrationInterface {
    name = 'AddSkillsToTalentTable1688993873438';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`talent_skills_skill\` (\`talentId\` varchar(36) NOT NULL, \`skillId\` varchar(36) NOT NULL, INDEX \`IDX_bdc9803cb0ff651190f1ce64b8\` (\`talentId\`), INDEX \`IDX_4add5da0a201d579785913aa1e\` (\`skillId\`), PRIMARY KEY (\`talentId\`, \`skillId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`talent_skills_skill\` ADD CONSTRAINT \`FK_bdc9803cb0ff651190f1ce64b85\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`talent_skills_skill\` ADD CONSTRAINT \`FK_4add5da0a201d579785913aa1e7\` FOREIGN KEY (\`skillId\`) REFERENCES \`skill\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent_skills_skill\` DROP FOREIGN KEY \`FK_4add5da0a201d579785913aa1e7\``);
        await queryRunner.query(`ALTER TABLE \`talent_skills_skill\` DROP FOREIGN KEY \`FK_bdc9803cb0ff651190f1ce64b85\``);
        await queryRunner.query(`DROP INDEX \`IDX_4add5da0a201d579785913aa1e\` ON \`talent_skills_skill\``);
        await queryRunner.query(`DROP INDEX \`IDX_bdc9803cb0ff651190f1ce64b8\` ON \`talent_skills_skill\``);
        await queryRunner.query(`DROP TABLE \`talent_skills_skill\``);
    }
}
