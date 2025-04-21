import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveValuInTalent1705429751252 implements MigrationInterface {
    name = 'MoveValuInTalent1705429751252';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`talent_values_value\` (\`talentId\` varchar(36) NOT NULL, \`valueId\` varchar(36) NOT NULL, INDEX \`IDX_c220e10e248c1a5972c1680e8e\` (\`talentId\`), INDEX \`IDX_6544c2a6ed72fdd742f2f22bf6\` (\`valueId\`), PRIMARY KEY (\`talentId\`, \`valueId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`talent_values_value\` ADD CONSTRAINT \`FK_c220e10e248c1a5972c1680e8e4\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`talent_values_value\` ADD CONSTRAINT \`FK_6544c2a6ed72fdd742f2f22bf62\` FOREIGN KEY (\`valueId\`) REFERENCES \`value\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent_values_value\` DROP FOREIGN KEY \`FK_6544c2a6ed72fdd742f2f22bf62\``);
        await queryRunner.query(`ALTER TABLE \`talent_values_value\` DROP FOREIGN KEY \`FK_c220e10e248c1a5972c1680e8e4\``);
        await queryRunner.query(`DROP INDEX \`IDX_6544c2a6ed72fdd742f2f22bf6\` ON \`talent_values_value\``);
        await queryRunner.query(`DROP INDEX \`IDX_c220e10e248c1a5972c1680e8e\` ON \`talent_values_value\``);
        await queryRunner.query(`DROP TABLE \`talent_values_value\``);
    }
}
