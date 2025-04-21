import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedia1683098525353 implements MigrationInterface {
    name = 'CreateMedia1683098525353';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`media\` (\`id\` varchar(36) NOT NULL, \`fileUrl\` varchar(255) NOT NULL, \`fileType\` varchar(255) NOT NULL, \`fileName\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_9eaffae6004754d19562b9d3bd\` (\`fileUrl\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`media\``);
    }
}
