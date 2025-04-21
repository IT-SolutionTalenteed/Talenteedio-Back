import { composeResolvers } from '@graphql-tools/resolvers-composition';

import AppDataSource from '../../../database';
import { Setting, Address, Contact } from '../../../database/entities';
import guard from '../../middleware/graphql-guard';

import { Payload } from '../../../type';
import { returnError } from '../../../helpers/graphql';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getSetting: async (): Promise<Setting | null> => {
            try {
                return await Setting.findOne({ where: {}, relations: ['contact.address', 'homeImage1', 'homeImage2', 'homeImage3'] });
            } catch (error) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createOrUpdateSetting: async (_: any, args: { input: Setting }): Promise<Payload> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                await Setting.clear();

                const address = Object.assign(new Address(), args.input.contact.address);
                await queryRunner.manager.save(address);

                const contact = Object.assign(new Contact(), { ...args.input.contact, address: undefined }) as Contact;
                contact.address = address;
                await queryRunner.manager.save(contact);

                const setting = Object.assign(new Setting(), { ...args.input, contact: undefined }) as Setting;
                setting.contact = contact;
                await queryRunner.manager.save(setting);

                await queryRunner.commitTransaction();

                return {
                    success: true,
                    msg: 'Setting updated',
                };
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            } finally {
                // Release the query runner when done.
                await queryRunner.release();
            }
        },
    },
};

const resolversComposition = {
    'Mutation.createOrUpdateSetting': [guard(['admin'])],
};

export default composeResolvers(resolver, resolversComposition);
