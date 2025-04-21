import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventEnumToModelInCategoryTable1696441783482 implements MigrationInterface {
    name = 'AddEventEnumToModelInCategoryTable1696441783482';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`model\` \`model\` enum ('Company', 'Referral', 'Job', 'Talent', 'Job_Talent', 'Article', 'Event') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`model\` \`model\` enum ('Company', 'Referral', 'Job', 'Talent', 'Job_Talent', 'Article') NOT NULL`);
    }
}
