import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';

import { Admin, Role, User, JobType, Skill, Category, Location, Testimonial, Article, Address, Contact, Setting, Value } from '../entities';

import roles from '../../helpers/data/roles';
import admins from '../../helpers/data/admins';
import settings from '../../helpers/data/settings';
import jobTypes from '../../helpers/data/jobTypes';
import skills from '../../helpers/data/skills';
import jobTalentCategories from '../../helpers/data/job-talent-categories';
import companyCategories from '../../helpers/data/company-categories';
import articleCategories from '../../helpers/data/article-categories';
import referralCategories from '../../helpers/data/referral-categories';
import locations from '../../helpers/data/locations';
import testimonials from '../../helpers/data/testimonials';
import articles from '../../helpers/data/articles';
import values from '../../helpers/data/values';

import { Class } from '../../type';

export default class DBSeeder implements Seeder {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async run(dataSource: DataSource): Promise<any> {
        // Create Role

        await Role.insert(roles as Role[]);

        // Create Admin user

        await Promise.all(
            admins.map(async (admin) => {
                const newUser = new User();

                newUser.email = admin.email;
                newUser.firstname = admin.firstname;
                newUser.lastname = admin.lastname;
                newUser.setPasswd(admin.password);
                newUser.validateAt = new Date();

                newUser.admin = new Admin();
                await newUser.admin.save();
                await newUser.save();

                return admin;
            })
        );

        // Create Setting

        const address = Object.assign(new Address(), settings.contact.address);
        await address.save();

        const contact = Object.assign(new Contact(), {
            ...settings.contact,
            address: undefined,
        }) as Contact;
        contact.address = address;
        await contact.save();

        const setting = Object.assign(new Setting(), { ...settings, contact: undefined }) as Setting;
        setting.contact = contact;
        await setting.save();

        // Create all data in tables

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tables: { data: any; entity: Class<any> }[] = [
            { data: jobTypes, entity: JobType },
            { data: skills, entity: Skill },
            { data: jobTalentCategories, entity: Category },
            { data: companyCategories, entity: Category },
            { data: articleCategories, entity: Category },
            { data: referralCategories, entity: Category },
            { data: locations, entity: Location },
            { data: testimonials, entity: Testimonial },
            { data: articles, entity: Article },
            { data: values, entity: Value },
        ];

        await Promise.all(
            tables.map(async (e) => {
                await Promise.all(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    e.data.map(async (el: any) => {
                        const repositoty = dataSource.getRepository(e.entity);
                        const newEl = Object.assign(new e.entity(), el);
                        await repositoty.save(newEl);

                        return el;
                    })
                );

                return e;
            })
        );
    }
}
