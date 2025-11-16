import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeFieldsToUser1700000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'stripeCustomerId',
                type: 'varchar',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'stripeSubscriptionId',
                type: 'varchar',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'stripePriceId',
                type: 'varchar',
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'subscriptionStatus',
                type: 'varchar',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user', 'subscriptionStatus');
        await queryRunner.dropColumn('user', 'stripePriceId');
        await queryRunner.dropColumn('user', 'stripeSubscriptionId');
        await queryRunner.dropColumn('user', 'stripeCustomerId');
    }
}
