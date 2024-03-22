const path = require('path');

module.exports = ({ env }) => {
  const isProduction = env("NODE_ENV") === "production"
  console.log("isProduction",env("NODE_ENV"));
  return {
    connection: {
      client: "mysql",
      connection: {
        host: isProduction ?  env("DATABASE_HOST", "127.0.0.1") :  env("DATABASE_HOST_DEV", "127.0.0.1"),
        port: env.int("DATABASE_PORT", 3306),
        database: env("DATABASE_NAME", "wen"),
        user: env("DATABASE_USERNAME", "root"),
        password: env("DATABASE_PASSWORD", "Mckdtlr12!@"),
        ssl: env.bool("DATABASE_SSL", true),
      },
      useNullAsDefault: true,
    },
  }
};
