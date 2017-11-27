export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  db: {
    database: 'test',
    username: 'test',
    password: 'test',
    host: '127.0.0.1',
    dialect: 'sqlite',
    storage: './database.sqlite',
  }
}
