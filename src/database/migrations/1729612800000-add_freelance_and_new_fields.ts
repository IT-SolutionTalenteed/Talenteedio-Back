import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFreelanceAndNewFields1729612800000 implements MigrationInterface {
    name = 'AddFreelanceAndNewFields1729612800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create freelance table
        await queryRunner.query(`
            CREATE TABLE \`freelance\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NULL,
                \`status\` enum ('public', 'private') NOT NULL DEFAULT 'public',
                \`tjm\` decimal(10,2) NULL,
                \`mobility\` varchar(255) NULL,
                \`availabilityDate\` date NULL,
                \`desiredLocation\` varchar(255) NULL,
                \`workMode\` enum ('remote', 'hybrid', 'onsite') NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`roleId\` varchar(36) NULL,
                \`userId\` varchar(36) NULL,
                \`categoryId\` varchar(36) NULL,
                \`contactId\` varchar(36) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Add foreign keys to freelance table
        await queryRunner.query(`
            ALTER TABLE \`freelance\` 
            ADD CONSTRAINT \`FK_freelance_role\` 
            FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE \`freelance\` 
            ADD CONSTRAINT \`FK_freelance_user\` 
            FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE \`freelance\` 
            ADD CONSTRAINT \`FK_freelance_category\` 
            FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE \`freelance\` 
            ADD CONSTRAINT \`FK_freelance_contact\` 
            FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create freelance_values junction table
        await queryRunner.query(`
            CREATE TABLE \`freelance_values_value\` (
                \`freelanceId\` varchar(36) NOT NULL,
                \`valueId\` varchar(36) NOT NULL,
                INDEX \`IDX_freelance_values_freelance\` (\`freelanceId\`),
                INDEX \`IDX_freelance_values_value\` (\`valueId\`),
                PRIMARY KEY (\`freelanceId\`, \`valueId\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            ALTER TABLE \`freelance_values_value\` 
            ADD CONSTRAINT \`FK_freelance_values_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`freelance_values_value\` 
            ADD CONSTRAINT \`FK_freelance_values_value\` 
            FOREIGN KEY (\`valueId\`) REFERENCES \`value\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Add new fields to talent table
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`tjm\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`mobility\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`availabilityDate\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`desiredLocation\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD \`workMode\` enum ('remote', 'hybrid', 'onsite') NULL`);

        // Add freelance relation to user table
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`freelanceId\` varchar(36) NULL`);
        await queryRunner.query(`
            ALTER TABLE \`user\` 
            ADD CONSTRAINT \`FK_user_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Modify CV table to support freelance
        await queryRunner.query(`ALTER TABLE \`cv\` MODIFY \`talentId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`freelanceId\` varchar(36) NULL`);
        await queryRunner.query(`
            ALTER TABLE \`cv\` 
            ADD CONSTRAINT \`FK_cv_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Modify LM table to support freelance
        await queryRunner.query(`ALTER TABLE \`lm\` MODIFY \`talentId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`lm\` ADD \`freelanceId\` varchar(36) NULL`);
        await queryRunner.query(`
            ALTER TABLE \`lm\` 
            ADD CONSTRAINT \`FK_lm_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add freelance relation to application table
        await queryRunner.query(`ALTER TABLE \`application\` ADD \`freelanceId\` varchar(36) NULL`);
        await queryRunner.query(`
            ALTER TABLE \`application\` 
            ADD CONSTRAINT \`FK_application_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Add freelance role to role table if not exists
        await queryRunner.query(`
            INSERT INTO \`role\` (\`id\`, \`name\`, \`title\`, \`createdAt\`) 
            SELECT UUID(), 'freelance', 'Freelance', NOW() 
            WHERE NOT EXISTS (SELECT 1 FROM \`role\` WHERE \`name\` = 'freelance')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove freelance relation from application table
        await queryRunner.query(`ALTER TABLE \`application\` DROP FOREIGN KEY \`FK_application_freelance\``);
        await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`freelanceId\``);

        // Remove freelance relation from LM table
        await queryRunner.query(`ALTER TABLE \`lm\` DROP FOREIGN KEY \`FK_lm_freelance\``);
        await queryRunner.query(`ALTER TABLE \`lm\` DROP COLUMN \`freelanceId\``);
        await queryRunner.query(`ALTER TABLE \`lm\` MODIFY \`talentId\` varchar(36) NOT NULL`);

        // Remove freelance relation from CV table
        await queryRunner.query(`ALTER TABLE \`cv\` DROP FOREIGN KEY \`FK_cv_freelance\``);
        await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`freelanceId\``);
        await queryRunner.query(`ALTER TABLE \`cv\` MODIFY \`talentId\` varchar(36) NOT NULL`);

        // Remove freelance relation from user table
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_user_freelance\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`freelanceId\``);

        // Remove new fields from talent table
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`workMode\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`desiredLocation\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`availabilityDate\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`mobility\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP COLUMN \`tjm\``);

        // Drop freelance_values junction table
        await queryRunner.query(`ALTER TABLE \`freelance_values_value\` DROP FOREIGN KEY \`FK_freelance_values_value\``);
        await queryRunner.query(`ALTER TABLE \`freelance_values_value\` DROP FOREIGN KEY \`FK_freelance_values_freelance\``);
        await queryRunner.query(`DROP TABLE \`freelance_values_value\``);

        // Drop freelance table
        await queryRunner.query(`ALTER TABLE \`freelance\` DROP FOREIGN KEY \`FK_freelance_contact\``);
        await queryRunner.query(`ALTER TABLE \`freelance\` DROP FOREIGN KEY \`FK_freelance_category\``);
        await queryRunner.query(`ALTER TABLE \`freelance\` DROP FOREIGN KEY \`FK_freelance_user\``);
        await queryRunner.query(`ALTER TABLE \`freelance\` DROP FOREIGN KEY \`FK_freelance_role\``);
        await queryRunner.query(`DROP TABLE \`freelance\``);

        // Remove freelance role
        await queryRunner.query(`DELETE FROM \`role\` WHERE \`name\` = 'freelance'`);
    }
}
