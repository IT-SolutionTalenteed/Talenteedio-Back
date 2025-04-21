import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetTitleToNullableInTalentAndReferralTable1689136666272 implements MigrationInterface {
    name = 'SetTitleToNullableInTalentAndReferralTable1689136666272';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referral\` CHANGE \`title\` \`title\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` CHANGE \`title\` \`title\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`talent\` CHANGE \`title\` \`title\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`referral\` CHANGE \`title\` \`title\` varchar(255) NOT NULL`);
    }
}
