import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddValueTable1701067760153 implements MigrationInterface {
    name = 'AddValueTable1701067760153';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`value\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`job_values_value\` (\`jobId\` varchar(36) NOT NULL, \`valueId\` varchar(36) NOT NULL, INDEX \`IDX_88c856f0fb23dbc67f7335e4d4\` (\`jobId\`), INDEX \`IDX_2eb33833fb6cea24c507b6df4b\` (\`valueId\`), PRIMARY KEY (\`jobId\`, \`valueId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cv_values_value\` (\`cvId\` varchar(36) NOT NULL, \`valueId\` varchar(36) NOT NULL, INDEX \`IDX_9ce65fe0136c4188207f74270e\` (\`cvId\`), INDEX \`IDX_0aa35b0b42ba1100f1260aed5c\` (\`valueId\`), PRIMARY KEY (\`cvId\`, \`valueId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`job_values_value\` ADD CONSTRAINT \`FK_88c856f0fb23dbc67f7335e4d46\` FOREIGN KEY (\`jobId\`) REFERENCES \`job\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`job_values_value\` ADD CONSTRAINT \`FK_2eb33833fb6cea24c507b6df4b1\` FOREIGN KEY (\`valueId\`) REFERENCES \`value\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`cv_values_value\` ADD CONSTRAINT \`FK_9ce65fe0136c4188207f74270e9\` FOREIGN KEY (\`cvId\`) REFERENCES \`cv\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`cv_values_value\` ADD CONSTRAINT \`FK_0aa35b0b42ba1100f1260aed5c6\` FOREIGN KEY (\`valueId\`) REFERENCES \`value\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cv_values_value\` DROP FOREIGN KEY \`FK_0aa35b0b42ba1100f1260aed5c6\``);
        await queryRunner.query(`ALTER TABLE \`cv_values_value\` DROP FOREIGN KEY \`FK_9ce65fe0136c4188207f74270e9\``);
        await queryRunner.query(`ALTER TABLE \`job_values_value\` DROP FOREIGN KEY \`FK_2eb33833fb6cea24c507b6df4b1\``);
        await queryRunner.query(`ALTER TABLE \`job_values_value\` DROP FOREIGN KEY \`FK_88c856f0fb23dbc67f7335e4d46\``);
        await queryRunner.query(`DROP INDEX \`IDX_0aa35b0b42ba1100f1260aed5c\` ON \`cv_values_value\``);
        await queryRunner.query(`DROP INDEX \`IDX_9ce65fe0136c4188207f74270e\` ON \`cv_values_value\``);
        await queryRunner.query(`DROP TABLE \`cv_values_value\``);
        await queryRunner.query(`DROP INDEX \`IDX_2eb33833fb6cea24c507b6df4b\` ON \`job_values_value\``);
        await queryRunner.query(`DROP INDEX \`IDX_88c856f0fb23dbc67f7335e4d4\` ON \`job_values_value\``);
        await queryRunner.query(`DROP TABLE \`job_values_value\``);
        await queryRunner.query(`DROP TABLE \`value\``);
    }
}
