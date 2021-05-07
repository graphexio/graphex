const config = {
  dialect: process.env.DATABASE_DIALECT,
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

// const config = {
//   username: 'mydbuser',
//   password: 'donttellasoul',
//   database: 'mydbname',
//   host: '127.0.0.1',
//   dialect: 'postgres',
// };

module.exports = {
  development: config,
  test: config,
  local: config,
  production: config,
};
