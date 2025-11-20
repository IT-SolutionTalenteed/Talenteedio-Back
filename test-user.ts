import 'reflect-metadata';
import dotenv from 'dotenv';
import AppDataSource from './src/database';
import { User } from './src/database/entities';

dotenv.config();

const testUser = async () => {
    try {
        await AppDataSource.initialize();
        console.log('DB connected!');

        // List all users
        const users = await User.find({ select: ['id', 'email', 'name'] });
        console.log('\n=== Users in database ===');
        users.forEach(user => {
            console.log(`- ${user.email} (${user.name})`);
        });

        // Test a specific user
        const email = process.argv[2];
        if (email) {
            console.log(`\n=== Testing user: ${email} ===`);
            const user = await User.findOne({ 
                where: { email }, 
                relations: ['admin', 'company', 'referral', 'talent']
            });
            
            if (user) {
                console.log('✓ User found!');
                console.log('- ID:', user.id);
                console.log('- Name:', user.name);
                console.log('- Email:', user.email);
                console.log('- Admin:', !!user.admin);
                console.log('- Company:', !!user.company);
                console.log('- Talent:', !!user.talent);
                console.log('- Referral:', !!user.referral);
            } else {
                console.log('✗ User not found!');
            }
        }

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testUser();
