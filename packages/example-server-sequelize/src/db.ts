import { Sequelize } from 'sequelize-typescript';

const sequelizePostgres = new Sequelize(
  process.env.DATABASE_NAME, //
  null,
  null,
  {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    dialect: 'postgres',
    quoteIdentifiers: false,
    logging: true,
    pool: { max: 1, min: 1, idle: 10000 },
    models: [__dirname + '/models/**/*.model.ts'],
  }
);

sequelizePostgres
  .authenticate()
  .then(async () => {
    console.log('Connection to PostgreSQL has been established successfully.');
    await sequelizePostgres.sync({ force: false });
  })
  .catch((err) => {
    console.log('Unable to connect to the PostgreSQL database:', err);
  });

export default sequelizePostgres;
