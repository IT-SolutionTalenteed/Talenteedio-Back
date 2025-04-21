import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticleEnumToCategoryModel1688159486829 implements MigrationInterface {
    name = 'AddArticleEnumToCategoryModel1688159486829';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`model\` \`model\` enum ('Company', 'Job', 'Talent', 'Job_Talent', 'Article') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`model\` \`model\` enum ('Company', 'Job', 'Talent', 'Job_Talent') NOT NULL`);
    }
}
