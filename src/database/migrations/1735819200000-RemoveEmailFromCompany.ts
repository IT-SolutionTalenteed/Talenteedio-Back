import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveEmailFromCompany1735819200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne existe avant de la supprimer
    const table = await queryRunner.getTable('company');
    const emailColumn = table?.findColumnByName('email');

    if (emailColumn) {
      await queryRunner.dropColumn('company', 'email');
      console.log('✅ Colonne email supprimée de la table company');
    } else {
      console.log('ℹ️  La colonne email n\'existe pas dans la table company');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurer la colonne si besoin de rollback
    await queryRunner.addColumn(
      'company',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );
    console.log('✅ Colonne email restaurée dans la table company');
  }
}
