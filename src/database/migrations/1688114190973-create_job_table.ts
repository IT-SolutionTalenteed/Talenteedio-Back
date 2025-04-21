import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobTable1688114190973 implements MigrationInterface {
    name = 'CreateJobTable1688114190973';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`job\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`expirationDate\` date NOT NULL, \`hours\` int NOT NULL, \`hourType\` enum ('day', 'week', 'month', 'year') NOT NULL, \`gender\` enum ('male', 'female', 'other') NULL, \`salaryMin\` int NULL, \`salaryMax\` int NULL, \`salaryType\` enum ('hourly', 'daily', 'weekly', 'monthly', 'yearly') NULL, \`experience\` int NULL, \`recruitmentNumber\` int NULL, \`status\` enum ('public', 'draft', 'blocked', 'in_review') NOT NULL DEFAULT 'public', \`isFeatured\` tinyint NOT NULL DEFAULT 0, \`isUrgent\` tinyint NOT NULL DEFAULT 0, \`featuredImageId\` varchar(36) NULL, \`locationId\` varchar(36) NULL, \`jobTypeId\` varchar(36) NULL, \`categoryId\` varchar(36) NULL, \`companyId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_5ce49b2c56f61fbf5f3d983a744\` FOREIGN KEY (\`featuredImageId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_e9238c85e383495936b122f19c8\` FOREIGN KEY (\`locationId\`) REFERENCES \`location\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_09327f0689f3b99a11a9dcfc0b9\` FOREIGN KEY (\`jobTypeId\`) REFERENCES \`job_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_ab0702755e36375136d7b54207f\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_e66170573cabd565dab1132727d\` FOREIGN KEY (\`companyId\`) REFERENCES \`company\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_e66170573cabd565dab1132727d\``);
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_ab0702755e36375136d7b54207f\``);
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_09327f0689f3b99a11a9dcfc0b9\``);
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_e9238c85e383495936b122f19c8\``);
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_5ce49b2c56f61fbf5f3d983a744\``);
        await queryRunner.query(`DROP TABLE \`job\``);
    }
}
