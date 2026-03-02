import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFeedbackFieldsToAppointments1738454400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les colonnes de feedback
    await queryRunner.addColumn(
      'company_appointment',
      new TableColumn({
        name: 'feedbackEmailSent',
        type: 'boolean',
        default: false,
      })
    );

    await queryRunner.addColumn(
      'company_appointment',
      new TableColumn({
        name: 'feedbackSubmitted',
        type: 'boolean',
        default: false,
      })
    );

    await queryRunner.addColumn(
      'company_appointment',
      new TableColumn({
        name: 'candidateFeedback',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'company_appointment',
      new TableColumn({
        name: 'candidateDecision',
        type: 'varchar',
        length: '20',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'company_appointment',
      new TableColumn({
        name: 'candidateRating',
        type: 'int',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'company_appointment',
      new TableColumn({
        name: 'feedbackSubmittedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('company_appointment', 'feedbackSubmittedAt');
    await queryRunner.dropColumn('company_appointment', 'candidateRating');
    await queryRunner.dropColumn('company_appointment', 'candidateDecision');
    await queryRunner.dropColumn('company_appointment', 'candidateFeedback');
    await queryRunner.dropColumn('company_appointment', 'feedbackSubmitted');
    await queryRunner.dropColumn('company_appointment', 'feedbackEmailSent');
  }
}
