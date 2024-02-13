'use strict';

/**
 * early-user router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::early-user.early-user', {
    config: {
        findMany: {
          middlewares: [
            // point to a registered middleware
            "plugin::users-permissions.rateLimit",
          ],
        },
        findOne: {
          middlewares: [
            // point to a registered middleware
            "plugin::users-permissions.rateLimit",
          ],
        },
        create: {
            middlewares: [
              // point to a registered middleware
              "plugin::users-permissions.rateLimit",
            ],
          },
          update: {
            middlewares: [
              // point to a registered middleware
              "plugin::users-permissions.rateLimit",
            ],
          },
          delete: {
            middlewares: [
              // point to a registered middleware
              "plugin::users-permissions.rateLimit",
            ],
          },


      },
});
