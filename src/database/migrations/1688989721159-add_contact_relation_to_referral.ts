import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactRelationToReferral1688989721159 implements MigrationInterface {
    name = 'AddContactRelationToReferral1688989721159';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referral\` ADD \`contactId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD UNIQUE INDEX \`IDX_56fb58efcd36502a8020db3d80\` (\`contactId\`)`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD CONSTRAINT \`FK_56fb58efcd36502a8020db3d80b\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referral\` DROP FOREIGN KEY \`FK_56fb58efcd36502a8020db3d80b\``);
        await queryRunner.query(`DROP INDEX \`REL_56fb58efcd36502a8020db3d80\` ON \`referral\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP COLUMN \`contactId\``);
    }
}
