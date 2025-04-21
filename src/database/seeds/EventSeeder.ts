import { Seeder } from 'typeorm-extension';

import { Event, Admin } from '../entities';

import { EVENTS } from '../../helpers/data/events';

export default class EventSeeder implements Seeder {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async run(): Promise<any> {
        const admin = await Admin.findOne({
            where: {
                user: {
                    email: 'contact@solutiontalenteed.com',
                },
            },
        });

        if (admin) {
            for (const _event of EVENTS) {
                const event: Event = Object.assign(new Event(), { ..._event, admin });
                await event.save();
            }
        }
    }
}
