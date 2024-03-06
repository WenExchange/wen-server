"use strict";

/**
 * collection router
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = {
  routes: [
    {
      method: "POST",
      path: "collection/fee",
      handler: "collection.getFeesFromCollections",
      config: {
        policies: [],
        middlewares: [
          // "plugin::users-permissions.rateLimit",
        ],
      },
    },
  ],
};
