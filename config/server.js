const cronTasks = require("../src/cron/cronTasks")
const {SERVER_TYPE} = require("../src/utils/constants")
module.exports = ({ env }) => {
  const isBOTServer = env("SERVER_TYPE") === SERVER_TYPE.BOT
  console.log("SERVER_TYPE",env("SERVER_TYPE"));
  return {
  
    host: env('HOST', '127.0.0.1'),
    port: env.int('PORT', 1337),
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
    cron: {
      enabled: isBOTServer,
      tasks: cronTasks,
    },
  
  }
};

