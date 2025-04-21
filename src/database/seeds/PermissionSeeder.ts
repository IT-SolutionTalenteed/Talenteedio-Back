import { Seeder } from 'typeorm-extension';

import { Permission, Company } from '../entities';

import permissionData from '../../helpers/data/permission';

export default class PermissionSeeder implements Seeder {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async run(): Promise<any> {
        let permission = await Permission.findOne({
            where: {
                title: permissionData.title,
            },
        });

        if (!permission) {
            permission = Object.assign(new Permission(), permissionData);
            await permission.save();
        }

        const companies = await Company.find({
            where: {},
            relations: ['permission'],
        });

        for (const company of companies) {
            if (!company.permission) {
                company.permission = permission;
                await company.save();
            }
        }
    }
}
