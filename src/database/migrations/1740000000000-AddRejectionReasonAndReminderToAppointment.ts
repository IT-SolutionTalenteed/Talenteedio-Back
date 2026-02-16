import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRejectionReasonAndReminderToAppointment1740000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne rejectionReason
        await queryRunner.addColumn(
            'company_appointment',
            new TableColumn({
                name: 'rejectionReason',
                type: 'text',
                isNullable: true,
            })
        );

        // Ajouter la colonne reminderSent
        await queryRunner.addColumn(
            'company_appointment',
            new TableColumn({
                name: 'reminderSent',
                type: 'boolean',
                default: false,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les colonnes en cas de rollback
        await queryRunner.dropColumn('company_appointment', 'reminderSent');
        await queryRunner.dropColumn('company_appointment', 'rejectionReason');
    }
}
