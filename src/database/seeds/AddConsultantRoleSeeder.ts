import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../entities';

export default class AddConsultantRoleSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        const roleRepository = dataSource.getRepository(Role);

        // Check if consultant role already exists
        const existingRole = await roleRepository.findOne({
            where: { name: 'consultant' },
        });

        if (!existingRole) {
            const consultantRole = roleRepository.create({
                name: 'consultant',
                title: 'Consultant',
            });

            await roleRepository.save(consultantRole);
            console.log('Consultant role created successfully');
        } else {
            console.log('Consultant role already exists');
        }
    }
}
