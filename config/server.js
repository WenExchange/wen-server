const cronTasks = require("../src/cron/cronTasks")
module.exports = ({ env }) => {
  const isAPIServer = env("SERVER_TYPE") === "API"
  console.log("isAPIServer",isAPIServer);
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
      enabled: isAPIServer ? false : true,
      // tasks: cronTasks,
      tasks: {
        test: {
          task: async ({ strapi }) => {
            console.log("test task");
          },
          options: {
            rule: `*/1 * * * * *`,
          },
        }
      }
    },
  
  }
};

