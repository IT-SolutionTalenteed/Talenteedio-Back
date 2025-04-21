import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCvAndLmTables1689188990946 implements MigrationInterface {
    name = 'CreateCvAndLmTables1689188990946';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_6607d283c0cf86d8a4692c985ba\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_dbc0341504212f830211b69ba0c\``);
        await queryRunner.query(`CREATE TABLE \`cv\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`data\` json NOT NULL, \`talentId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`lm\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`talentId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`cvId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`lmId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_dbc0341504212f830211b69ba0c\` FOREIGN KEY (\`jobId\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_6607d283c0cf86d8a4692c985ba\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_954cad23ae42a1f52ec09284fca\` FOREIGN KEY (\`cvId\`) REFERENCES \`cv\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_c8ddbf945a19dbd66cb6cd9d05d\` FOREIGN KEY (\`lmId\`) REFERENCES \`lm\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD CONSTRAINT \`FK_0d52f7ec3672fac62865b2bb559\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`lm\` ADD CONSTRAINT \`FK_ddec854ffdf1e311747a3fe22d4\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`lm\` DROP FOREIGN KEY \`FK_ddec854ffdf1e311747a3fe22d4\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP FOREIGN KEY \`FK_0d52f7ec3672fac62865b2bb559\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_dbc0341504212f830211b69ba0c\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_c8ddbf945a19dbd66cb6cd9d05d\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_954cad23ae42a1f52ec09284fca\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_6607d283c0cf86d8a4692c985ba\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`lmId\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`cvId\``);
        await queryRunner.query(`DROP TABLE \`lm\``);
        await queryRunner.query(`DROP TABLE \`cv\``);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_dbc0341504212f830211b69ba0c\` FOREIGN KEY (\`jobId\`) REFERENCES \`job\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`application\` ADD CONSTRAINT \`FK_6607d283c0cf86d8a4692c985ba\` FOREIGN KEY (\`talentId\`) REFERENCES \`talent\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
