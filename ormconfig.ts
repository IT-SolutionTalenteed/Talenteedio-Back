const { DataSource } = require('typeorm');
require('dotenv').config();

module.exports = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWD || '',
    database: process.env.DB || 'talenteedio',
    entities: ['src/database/entities/**/*{.ts,.js}'],
    migrations: ['src/database/migrations/**/*{.ts,.js}'],
    synchronize: false,
    logging: false,
});