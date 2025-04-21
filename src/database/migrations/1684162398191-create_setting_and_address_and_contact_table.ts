import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingAndAddressAndContactTable1684162398191 implements MigrationInterface {
    name = 'CreateSettingAndAddressAndContactTable1684162398191';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`address\` (\`id\` varchar(36) NOT NULL, \`line\` varchar(255) NOT NULL, \`postalCode\` varchar(255) NOT NULL, \`city\` varchar(255) NOT NULL, \`state\` varchar(255) NULL, \`country\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`contact\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NOT NULL, \`addressId\` varchar(36) NULL, UNIQUE INDEX \`REL_d7748995636532d90c30dbd760\` (\`addressId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`setting\` (\`id\` varchar(36) NOT NULL, \`contactId\` varchar(36) NULL, UNIQUE INDEX \`REL_0e045673aade57429f627ddcb8\` (\`contactId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`REL_0e045673aade57429f627ddcb8\` ON \`setting\``);
        await queryRunner.query(`DROP TABLE \`setting\``);
        await queryRunner.query(`DROP INDEX \`REL_d7748995636532d90c30dbd760\` ON \`contact\``);
        await queryRunner.query(`DROP TABLE \`contact\``);
        await queryRunner.query(`DROP TABLE \`address\``);
    }
}
