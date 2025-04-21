import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReffered1702656155319 implements MigrationInterface {
    name = 'AddReffered1702656155319';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`referred\` (\`id\` varchar(36) NOT NULL, \`talentEmail\` varchar(255) NOT NULL, \`talentNumber\` varchar(255) NOT NULL, \`jobReferenceLink\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`referralId\` varchar(36) NULL, \`jobId\` varchar(36) NULL, UNIQUE INDEX \`IDX_df0663443ba692e288ed0faebd\` (\`talentEmail\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`referred\``);
    }
}
