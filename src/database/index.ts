import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import { SeederOptions } from 'typeorm-extension';

import DBSeeder from './seeds/DBSeeder';
import PermissionSeeder from './seeds/PermissionSeeder';
import EventSeeder from './seeds/EventSeeder';
import AddHRFirstClubRoleSeeder from './seeds/AddHRFirstClubRoleSeeder';

dotenv.config();

const options: DataSourceOptions & SeederOptions = {
    name: 'default',
    type: process.env.DB_DIALECT as 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWD,
    database: process.env.DB,
    entities: [__dirname + '/entities/**/*{.ts,.js}'],
    synchronize: false,
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    logging: process.env.NODE_ENV === 'development' ? false : false,
    seeds: [DBSeeder, PermissionSeeder, EventSeeder, AddHRFirstClubRoleSeeder],
    factories: [__dirname + '/factories/**/*{.ts,.js}'],
};

const AppDataSource = new DataSource(options);

export default AppDataSource;
