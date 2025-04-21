import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTalentNumberNullableForReferredTable1702796481555 implements MigrationInterface {
    name = 'MakeTalentNumberNullableForReferredTable1702796481555';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referred\` CHANGE \`talentNumber\` \`talentNumber\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referred\` CHANGE \`talentNumber\` \`talentNumber\` varchar(255) NOT NULL`);
    }
}
