import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesToArticle1688111767373 implements MigrationInterface {
    name = 'AddCategoriesToArticle1688111767373';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`article_categories_category\` (\`articleId\` varchar(36) NOT NULL, \`categoryId\` varchar(36) NOT NULL, INDEX \`IDX_4ba35bcb36b2715f61faa696c7\` (\`articleId\`), INDEX \`IDX_5d9199768aa2bd9f91d175dc6d\` (\`categoryId\`), PRIMARY KEY (\`articleId\`, \`categoryId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`article_categories_category\` ADD CONSTRAINT \`FK_4ba35bcb36b2715f61faa696c7e\` FOREIGN KEY (\`articleId\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`article_categories_category\` ADD CONSTRAINT \`FK_5d9199768aa2bd9f91d175dc6d1\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article_categories_category\` DROP FOREIGN KEY \`FK_5d9199768aa2bd9f91d175dc6d1\``);
        await queryRunner.query(`ALTER TABLE \`article_categories_category\` DROP FOREIGN KEY \`FK_4ba35bcb36b2715f61faa696c7e\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ba35bcb36b2715f61faa696c7\` ON \`article_categories_category\``);
        await queryRunner.query(`DROP TABLE \`article_categories_category\``);
    }
}
