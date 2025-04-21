import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationWithAdminAndCategoryToEventTable1696430032284 implements MigrationInterface {
    name = 'AddRelationWithAdminAndCategoryToEventTable1696430032284';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`event\` ADD \`adminId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`event\` ADD CONSTRAINT \`FK_41d633c4273528f83d3ad8465e2\` FOREIGN KEY (\`adminId\`) REFERENCES \`admin\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE \`event_categories_category\` (\`eventId\` varchar(36) NOT NULL, \`categoryId\` varchar(36) NOT NULL, INDEX \`IDX_9fc5e5dab789917cc33940c08a\` (\`eventId\`), INDEX \`IDX_0c38526fad528c70c7c5baaa08\` (\`categoryId\`), PRIMARY KEY (\`eventId\`, \`categoryId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`event_categories_category\` ADD CONSTRAINT \`FK_9fc5e5dab789917cc33940c08a9\` FOREIGN KEY (\`eventId\`) REFERENCES \`event\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`event_categories_category\` ADD CONSTRAINT \`FK_0c38526fad528c70c7c5baaa081\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`event_categories_category\` DROP FOREIGN KEY \`FK_0c38526fad528c70c7c5baaa081\``);
        await queryRunner.query(`ALTER TABLE \`event_categories_category\` DROP FOREIGN KEY \`FK_9fc5e5dab789917cc33940c08a9\``);
        await queryRunner.query(`DROP INDEX \`IDX_0c38526fad528c70c7c5baaa08\` ON \`event_categories_category\``);
        await queryRunner.query(`DROP INDEX \`IDX_9fc5e5dab789917cc33940c08a\` ON \`event_categories_category\``);
        await queryRunner.query(`DROP TABLE \`event_categories_category\``);
        await queryRunner.query(`ALTER TABLE \`event\` DROP FOREIGN KEY \`FK_41d633c4273528f83d3ad8465e2\``);
        await queryRunner.query(`ALTER TABLE \`event\` DROP COLUMN \`adminId\``);
    }
}
