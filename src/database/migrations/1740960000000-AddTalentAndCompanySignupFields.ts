import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTalentAndCompanySignupFields1740960000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter les champs pour les Talents
        const talentTable = await queryRunner.getTable('talent');
        
        const talentColumns = [
            // Informations de base du candidat
            new TableColumn({
                name: 'annualSalary',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
                comment: 'Salaire annuel actuel'
            }),
            new TableColumn({
                name: 'yearsOfExperience',
                type: 'int',
                isNullable: true,
                comment: 'Années d\'expérience'
            }),
            new TableColumn({
                name: 'competences',
                type: 'text',
                isNullable: true,
                comment: 'Compétences du candidat'
            }),
            new TableColumn({
                name: 'languages',
                type: 'varchar',
                length: '500',
                isNullable: true,
                comment: 'Langues parlées'
            }),
            new TableColumn({
                name: 'country',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Pays'
            }),
            new TableColumn({
                name: 'city',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Ville'
            }),
            new TableColumn({
                name: 'address',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Adresse'
            }),
            new TableColumn({
                name: 'postalCode',
                type: 'varchar',
                length: '20',
                isNullable: true,
                comment: 'Code postal'
            }),
            new TableColumn({
                name: 'formations',
                type: 'text',
                isNullable: true,
                comment: 'Formations du candidat'
            }),
            new TableColumn({
                name: 'salaryRange',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Fourchette salariale souhaitée'
            }),
            new TableColumn({
                name: 'interests',
                type: 'text',
                isNullable: true,
                comment: 'Centres d\'intérêt'
            }),
            // Ce que veut le candidat
            new TableColumn({
                name: 'desiredWorkLocation',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Où le candidat veut travailler'
            }),
            new TableColumn({
                name: 'desiredContractType',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Type de contrat souhaité (CDI, CDD, Freelance, etc.)'
            }),
            new TableColumn({
                name: 'desiredPosition',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Poste souhaité'
            }),
            new TableColumn({
                name: 'desiredCompanyType',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Type d\'entreprise souhaité'
            }),
            new TableColumn({
                name: 'desiredSector',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Secteur d\'activité souhaité'
            })
        ];

        // Ajouter les colonnes qui n'existent pas déjà
        for (const column of talentColumns) {
            const existingColumn = talentTable?.findColumnByName(column.name);
            if (!existingColumn) {
                await queryRunner.addColumn('talent', column);
            }
        }

        // Ajouter les champs pour les Companies
        const companyTable = await queryRunner.getTable('company');
        
        const companyColumns = [
            new TableColumn({
                name: 'companySize',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Taille de l\'entreprise'
            }),
            new TableColumn({
                name: 'foundedYear',
                type: 'int',
                isNullable: true,
                comment: 'Année de création'
            }),
            new TableColumn({
                name: 'companyDescription',
                type: 'text',
                isNullable: true,
                comment: 'Description de l\'entreprise'
            }),
            new TableColumn({
                name: 'website',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Site web de l\'entreprise'
            }),
            new TableColumn({
                name: 'sector',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Secteur d\'activité'
            }),
            new TableColumn({
                name: 'country',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Pays'
            }),
            new TableColumn({
                name: 'city',
                type: 'varchar',
                length: '100',
                isNullable: true,
                comment: 'Ville'
            }),
            new TableColumn({
                name: 'address',
                type: 'varchar',
                length: '255',
                isNullable: true,
                comment: 'Adresse'
            }),
            new TableColumn({
                name: 'postalCode',
                type: 'varchar',
                length: '20',
                isNullable: true,
                comment: 'Code postal'
            })
        ];

        // Ajouter les colonnes qui n'existent pas déjà
        for (const column of companyColumns) {
            const existingColumn = companyTable?.findColumnByName(column.name);
            if (!existingColumn) {
                await queryRunner.addColumn('company', column);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les colonnes des Talents
        const talentTable = await queryRunner.getTable('talent');
        const talentColumnNames = [
            'annualSalary',
            'yearsOfExperience',
            'competences',
            'languages',
            'country',
            'city',
            'address',
            'postalCode',
            'formations',
            'salaryRange',
            'interests',
            'desiredWorkLocation',
            'desiredContractType',
            'desiredPosition',
            'desiredCompanyType',
            'desiredSector'
        ];

        for (const columnName of talentColumnNames) {
            const column = talentTable?.findColumnByName(columnName);
            if (column) {
                await queryRunner.dropColumn('talent', columnName);
            }
        }

        // Supprimer les colonnes des Companies
        const companyTable = await queryRunner.getTable('company');
        const companyColumnNames = [
            'companySize',
            'foundedYear',
            'companyDescription',
            'website',
            'sector',
            'country',
            'city',
            'address',
            'postalCode'
        ];

        for (const columnName of companyColumnNames) {
            const column = companyTable?.findColumnByName(columnName);
            if (column) {
                await queryRunner.dropColumn('company', columnName);
            }
        }
    }
}
