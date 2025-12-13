import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingValidationStatus1734100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Modifier l'enum pour ajouter les nouveaux statuts
        await queryRunner.query(`
            ALTER TABLE bookings 
            MODIFY COLUMN status ENUM(
                'pending', 
                'awaiting_validation', 
                'confirmed', 
                'rejected', 
                'cancelled', 
                'completed'
            ) DEFAULT 'pending'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revenir à l'ancien enum
        await queryRunner.query(`
            ALTER TABLE bookings 
            MODIFY COLUMN status ENUM(
                'pending', 
                'confirmed', 
                'cancelled', 
                'completed'
            ) DEFAULT 'pending'
        `);
    }
}