'use strict';

/**
 * `cache-logger` middleware
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    const keys = strapi.plugins["rest-cache"].services.cacheStore
    // strapi.log.info(`cached uids - ${JSON.stringify(keys)}`);
    await next();
  };
};
