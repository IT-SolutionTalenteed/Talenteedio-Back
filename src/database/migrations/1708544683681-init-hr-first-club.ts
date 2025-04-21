import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitHrFirstClub1708544683681 implements MigrationInterface {
    name = 'InitHrFirstClub1708544683681';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`hr_first_club\` (\`id\` varchar(36) NOT NULL, \`companyName\` varchar(255) NOT NULL, \`function\` varchar(255) NOT NULL, \`membershipReason\` varchar(255) NOT NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`roleId\` varchar(36) NULL, \`userId\` varchar(36) NULL, \`contactId\` varchar(36) NULL, UNIQUE INDEX \`REL_2860ec76e24bf629aa460feac9\` (\`userId\`), UNIQUE INDEX \`REL_d67ab0381310d31527768bddc4\` (\`contactId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` ADD CONSTRAINT \`FK_1876392ed593243307501b5627a\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` ADD CONSTRAINT \`FK_2860ec76e24bf629aa460feac9f\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` ADD CONSTRAINT \`FK_d67ab0381310d31527768bddc45\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` DROP FOREIGN KEY \`FK_d67ab0381310d31527768bddc45\``);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` DROP FOREIGN KEY \`FK_2860ec76e24bf629aa460feac9f\``);
        await queryRunner.query(`ALTER TABLE \`hr_first_club\` DROP FOREIGN KEY \`FK_1876392ed593243307501b5627a\``);
        await queryRunner.query(`DROP INDEX \`REL_d67ab0381310d31527768bddc4\` ON \`hr_first_club\``);
        await queryRunner.query(`DROP INDEX \`REL_2860ec76e24bf629aa460feac9\` ON \`hr_first_club\``);
        await queryRunner.query(`DROP TABLE \`hr_first_club\``);
    }
}
