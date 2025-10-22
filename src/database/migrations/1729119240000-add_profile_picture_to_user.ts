import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfilePictureToUser1729119240000 implements MigrationInterface {
    name = 'AddProfilePictureToUser1729119240000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`profilePictureId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_user_profilePicture\` FOREIGN KEY (\`profilePictureId\`) REFERENCES \`media\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_user_profilePicture\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`profilePictureId\``);
    }
}
