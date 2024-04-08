"use strict";

/**
 * collection router
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::collection.collection", {
    // config: {
    //     find: {
    //       middlewares: ["api::collection.cache-logger"],
    //     },
    //   },
});
