import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReferralTable1688987684732 implements MigrationInterface {
    name = 'UpdateReferralTable1688987684732';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referral\` ADD \`title\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD \`categoryId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`model\` \`model\` enum ('Company', 'Referral', 'Job', 'Talent', 'Job_Talent', 'Article') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`model\` \`model\` enum ('Company', 'Job', 'Talent', 'Job_Talent', 'Article') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP COLUMN \`categoryId\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP COLUMN \`title\``);
    }
}
