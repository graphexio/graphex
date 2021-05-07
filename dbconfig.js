const config = {
  dialect: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: 'yourdbname',
};

module.exports = {
  development: config,
  test: config,
  local: config,
  production: config,
};
