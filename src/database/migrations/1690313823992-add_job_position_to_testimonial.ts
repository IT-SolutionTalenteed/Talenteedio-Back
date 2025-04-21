import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobPositionToTestimonial1690313823992 implements MigrationInterface {
    name = 'AddJobPositionToTestimonial1690313823992';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`testimonial\` ADD \`jobPosition\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`testimonial\` DROP COLUMN \`jobPosition\``);
    }
}
