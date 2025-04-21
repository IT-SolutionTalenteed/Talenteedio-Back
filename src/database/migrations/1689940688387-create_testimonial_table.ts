import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTestimonialTable1689940688387 implements MigrationInterface {
    name = 'CreateTestimonialTable1689940688387';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`testimonial\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`comment\` text NOT NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`testimonial\``);
    }
}
