import { Seeder } from 'typeorm-extension';

import { Role } from '../entities';

const role = {
    name: 'hr-first-club',
    title: 'Hr first club',
};

export default class AddHRFirstClubRoleSeeder implements Seeder {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async run(): Promise<any> {
        await Role.insert(role as Role);
    }
}
