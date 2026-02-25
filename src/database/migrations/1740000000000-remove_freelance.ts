import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFreelance1740000000000 implements MigrationInterface {
    name = 'RemoveFreelance1740000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if freelance table exists
        const freelanceTableExists = await queryRunner.hasTable('freelance');
        
        if (freelanceTableExists) {
            // Remove freelance relation from application table
            const applicationTable = await queryRunner.getTable('application');
            const applicationFk = applicationTable?.foreignKeys.find(fk => fk.columnNames.indexOf('freelanceId') !== -1);
            if (applicationFk) {
                await queryRunner.dropForeignKey('application', applicationFk);
            }
            if (applicationTable?.columns.find(col => col.name === 'freelanceId')) {
                await queryRunner.query(`ALTER TABLE \`application\` DROP COLUMN \`freelanceId\``);
            }

            // Remove freelance relation from LM table
            const lmTable = await queryRunner.getTable('lm');
            const lmFk = lmTable?.foreignKeys.find(fk => fk.columnNames.indexOf('freelanceId') !== -1);
            if (lmFk) {
                await queryRunner.dropForeignKey('lm', lmFk);
            }
            if (lmTable?.columns.find(col => col.name === 'freelanceId')) {
                await queryRunner.query(`ALTER TABLE \`lm\` DROP COLUMN \`freelanceId\``);
            }

            // Remove freelance relation from CV table
            const cvTable = await queryRunner.getTable('cv');
            const cvFk = cvTable?.foreignKeys.find(fk => fk.columnNames.indexOf('freelanceId') !== -1);
            if (cvFk) {
                await queryRunner.dropForeignKey('cv', cvFk);
            }
            if (cvTable?.columns.find(col => col.name === 'freelanceId')) {
                await queryRunner.query(`ALTER TABLE \`cv\` DROP COLUMN \`freelanceId\``);
            }

            // Remove freelance relation from user table
            const userTable = await queryRunner.getTable('user');
            const userFk = userTable?.foreignKeys.find(fk => fk.columnNames.indexOf('freelanceId') !== -1);
            if (userFk) {
                await queryRunner.dropForeignKey('user', userFk);
            }
            if (userTable?.columns.find(col => col.name === 'freelanceId')) {
                await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`freelanceId\``);
            }

            // Drop freelance_values junction table
            const freelanceValuesTableExists = await queryRunner.hasTable('freelance_values_value');
            if (freelanceValuesTableExists) {
                await queryRunner.query(`DROP TABLE \`freelance_values_value\``);
            }

            // Drop freelance table
            await queryRunner.query(`DROP TABLE \`freelance\``);
        }

        // Remove freelance role
        await queryRunner.query(`DELETE FROM \`role\` WHERE \`name\` = 'freelance'`);

        // Delete or update categories with Freelance model before modifying enum
        await queryRunner.query(`DELETE FROM \`category\` WHERE \`model\` = 'Freelance'`);

        // Remove Freelance from category model enum (keeping all other existing values)
        await queryRunner.query(`
            ALTER TABLE \`category\` 
            MODIFY COLUMN \`model\` enum('Company', 'Referral', 'Job', 'Talent', 'Consultant', 'Job_Talent', 'Article', 'Event') NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore Freelance to category model enum
        await queryRunner.query(`
            ALTER TABLE \`category\` 
            MODIFY COLUMN \`model\` enum('Job', 'Article', 'Event', 'Talent', 'Referral', 'Freelance', 'Consultant') NULL
        `);

        // Add freelance role back
        await queryRunner.query(`
            INSERT INTO \`role\` (\`id\`, \`name\`, \`title\`, \`createdAt\`) 
            SELECT UUID(), 'freelance', 'Freelance', NOW() 
            WHERE NOT EXISTS (SELECT 1 FROM \`role\` WHERE \`name\` = 'freelance')
        `);

        // Recreate freelance table
        await queryRunner.query(`
            CREATE TABLE \`freelance\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NULL,
                \`status\` enum ('public', 'private') NOT NULL DEFAULT 'public',
                \`tjm\` decimal(10,2) NULL,
                \`annualSalary\` decimal(10,2) NULL,
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

        // Recreate freelance_values junction table
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

        // Add freelance relation to user table
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`freelanceId\` varchar(36) NULL`);
        await queryRunner.query(`
            ALTER TABLE \`user\` 
            ADD CONSTRAINT \`FK_user_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add freelance relation to CV table
        await queryRunner.query(`ALTER TABLE \`cv\` ADD \`freelanceId\` varchar(36) NULL`);
        await queryRunner.query(`
            ALTER TABLE \`cv\` 
            ADD CONSTRAINT \`FK_cv_freelance\` 
            FOREIGN KEY (\`freelanceId\`) REFERENCES \`freelance\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add freelance relation to LM table
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
    }
}
