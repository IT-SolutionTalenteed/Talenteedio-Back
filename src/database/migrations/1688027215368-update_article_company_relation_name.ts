import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateArticleCompanyRelationName1688027215368 implements MigrationInterface {
    name = 'UpdateArticleCompanyRelationName1688027215368';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`recruiterId\` \`companyId\` varchar(36) NULL DEFAULT 'NULL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`companyId\` \`recruiterId\` varchar(36) NULL DEFAULT 'NULL'`);
    }
}
