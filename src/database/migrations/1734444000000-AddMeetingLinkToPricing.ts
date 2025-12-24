import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMeetingLinkToPricing1734444000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pricing',
      new TableColumn({
        name: 'meetingLink',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pricing', 'meetingLink');
  }
}
