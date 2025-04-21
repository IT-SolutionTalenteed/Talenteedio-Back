import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConfigureDeleteCascadesOnTables1688938887215 implements MigrationInterface {
    name = 'ConfigureDeleteCascadesOnTables1688938887215';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_1b087964cd9a3453bef7e178cce\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_eaf0aee7b466ed67f506c8ddf2b\``);
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_5ce49b2c56f61fbf5f3d983a744\``);
        await queryRunner.query(`ALTER TABLE \`admin\` DROP FOREIGN KEY \`FK_f8a889c4362d78f056960ca6dad\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP FOREIGN KEY \`FK_1fbffba89b7ed9ca14a5b750240\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_c41a1d36702f2cd0403ce58d33a\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_89f58841dc3a1bd11fc3e5e46f6\``);

        await queryRunner.query(`ALTER TABLE \`admin\` ADD CONSTRAINT \`FK_f8a889c4362d78f056960ca6dad\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD CONSTRAINT \`FK_1fbffba89b7ed9ca14a5b750240\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_c41a1d36702f2cd0403ce58d33a\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_89f58841dc3a1bd11fc3e5e46f6\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD CONSTRAINT \`FK_9e8730599dfbfa1e2ae6225b95e\` FOREIGN KEY (\`imageId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_eaf0aee7b466ed67f506c8ddf2b\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_1b087964cd9a3453bef7e178cce\` FOREIGN KEY (\`logoId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`contact\` ADD CONSTRAINT \`FK_d7748995636532d90c30dbd7603\` FOREIGN KEY (\`addressId\`) REFERENCES \`address\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_0e045673aade57429f627ddcb80\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`location\` ADD CONSTRAINT \`FK_f9c9f4fd8190f76a85d23bf1c6b\` FOREIGN KEY (\`addressId\`) REFERENCES \`address\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_5ce49b2c56f61fbf5f3d983a744\` FOREIGN KEY (\`featuredImageId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_5ce49b2c56f61fbf5f3d983a744\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_1b087964cd9a3453bef7e178cce\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_eaf0aee7b466ed67f506c8ddf2b\``);

        await queryRunner.query(`ALTER TABLE \`admin\` DROP FOREIGN KEY \`FK_f8a889c4362d78f056960ca6dad\``);
        await queryRunner.query(`ALTER TABLE \`referral\` DROP FOREIGN KEY \`FK_1fbffba89b7ed9ca14a5b750240\``);
        await queryRunner.query(`ALTER TABLE \`company\` DROP FOREIGN KEY \`FK_c41a1d36702f2cd0403ce58d33a\``);
        await queryRunner.query(`ALTER TABLE \`talent\` DROP FOREIGN KEY \`FK_89f58841dc3a1bd11fc3e5e46f6\``);

        await queryRunner.query(`ALTER TABLE \`talent\` ADD CONSTRAINT \`FK_89f58841dc3a1bd11fc3e5e46f6\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_c41a1d36702f2cd0403ce58d33a\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`referral\` ADD CONSTRAINT \`FK_1fbffba89b7ed9ca14a5b750240\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`admin\` ADD CONSTRAINT \`FK_f8a889c4362d78f056960ca6dad\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`article\` DROP FOREIGN KEY \`FK_9e8730599dfbfa1e2ae6225b95e\``);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_1b087964cd9a3453bef7e178cce\` FOREIGN KEY (\`logoId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company\` ADD CONSTRAINT \`FK_eaf0aee7b466ed67f506c8ddf2b\` FOREIGN KEY (\`contactId\`) REFERENCES \`contact\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job\` ADD CONSTRAINT \`FK_5ce49b2c56f61fbf5f3d983a744\` FOREIGN KEY (\`featuredImageId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`contact\` DROP FOREIGN KEY \`FK_d7748995636532d90c30dbd7603\``);
        await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_0e045673aade57429f627ddcb80\``);
        await queryRunner.query(`ALTER TABLE \`location\` DROP FOREIGN KEY \`FK_f9c9f4fd8190f76a85d23bf1c6b\``);
    }
}
