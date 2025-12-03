import AppDataSource from './src/database';
import { Role } from './src/database/entities';

const addConsultantRole = async () => {
    try {
        await AppDataSource.initialize();
        console.log('DB connected');

        const roleRepository = AppDataSource.getRepository(Role);

        // Check if consultant role already exists
        const existingConsultant = await roleRepository.findOne({
            where: { name: 'consultant' as any },
        });

        if (!existingConsultant) {
            const consultantRole = roleRepository.create({
                name: 'consultant' as any,
                title: 'Consultant',
            });
            await roleRepository.save(consultantRole);
            console.log('✅ Consultant role created successfully');
        } else {
            console.log('ℹ️ Consultant role already exists');
        }

        // Check if freelance role already exists
        const existingFreelance = await roleRepository.findOne({
            where: { name: 'freelance' as any },
        });

        if (!existingFreelance) {
            const freelanceRole = roleRepository.create({
                name: 'freelance' as any,
                title: 'Freelance',
            });
            await roleRepository.save(freelanceRole);
            console.log('✅ Freelance role created successfully');
        } else {
            console.log('ℹ️ Freelance role already exists');
        }

        await AppDataSource.destroy();
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addConsultantRole();
