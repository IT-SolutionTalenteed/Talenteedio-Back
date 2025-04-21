import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAndRoleAndTableCorrespondingToTheRole1681925161427 implements MigrationInterface {
    name = 'CreateUserAndRoleAndTableCorrespondingToTheRole1681925161427';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`referral\` (\`id\` varchar(36) NOT NULL, \`roleId\` varchar(36) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_1fbffba89b7ed9ca14a5b75024\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`company\` (\`id\` varchar(36) NOT NULL, \`roleId\` varchar(36) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_c41a1d36702f2cd0403ce58d33\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`talent\` (\`id\` varchar(36) NOT NULL, \`roleId\` varchar(36) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_89f58841dc3a1bd11fc3e5e46f\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`firstname\` varchar(255) NULL, \`lastname\` varchar(255) NULL, \`validateAt\` date NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin\` (\`id\` varchar(36) NOT NULL, \`roleId\` varchar(36) NULL, \`userId\` varchar(36) NULL, UNIQUE INDEX \`REL_f8a889c4362d78f056960ca6da\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_session\` (\`id\` varchar(36) NOT NULL, \`expiresAt\` int NOT NULL, \`data\` json NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD CONSTRAINT \`FK_0fb9c51563a589c8a7225b6fff2\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD CONSTRAINT \`FK_1fbffba89b7ed9ca14a5b750240\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_8d6e97b0ff7c3d3dae08f51c1b5\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_c41a1d36702f2cd0403ce58d33a\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_12d18e6a130c4aba16e842bbc86\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_89f58841dc3a1bd11fc3e5e46f6\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`admin\` ADD CONSTRAINT \`FK_446fb0cc55eed0065ececcc889b\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`admin\` ADD CONSTRAINT \`FK_f8a889c4362d78f056960ca6dad\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`admin\` DROP FOREIGN KEY \`FK_f8a889c4362d78f056960ca6dad\``);
        await queryRunner.query(`ALTER TABLE \`admin\` DROP FOREIGN KEY \`FK_446fb0cc55eed0065ececcc889b\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_89f58841dc3a1bd11fc3e5e46f6\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_12d18e6a130c4aba16e842bbc86\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_c41a1d36702f2cd0403ce58d33a\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_8d6e97b0ff7c3d3dae08f51c1b5\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP FOREIGN KEY \`FK_1fbffba89b7ed9ca14a5b750240\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP FOREIGN KEY \`FK_0fb9c51563a589c8a7225b6fff2\``);
        await queryRunner.query(`DROP TABLE \`user_session\``);
        await queryRunner.query(`DROP INDEX \`REL_f8a889c4362d78f056960ca6da\` ON \`admin\``);
        await queryRunner.query(`DROP TABLE \`admin\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`REL_89f58841dc3a1bd11fc3e5e46f\` ON \`talent\``);
        await queryRunner.query(`DROP TABLE \`talent\``);
        await queryRunner.query(`DROP INDEX \`REL_c41a1d36702f2cd0403ce58d33\` ON \`company\``);
        await queryRunner.query(`DROP TABLE \`company\``);
        await queryRunner.query(`DROP INDEX \`REL_1fbffba89b7ed9ca14a5b75024\` ON \`referral\``);
        await queryRunner.query(`DROP TABLE \`referral\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``);
        await queryRunner.query(`DROP TABLE \`role\``);
    }
}
