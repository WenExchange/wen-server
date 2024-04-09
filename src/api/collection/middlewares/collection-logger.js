'use strict';
const dayjs = require("dayjs")
/**
 * `collection-logger` middleware
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const delta = Math.ceil((Date.now() - start) / 1000);
    const isDebug = delta > 5
    strapi.log[isDebug ? "debug" : "info"](`${dayjs().format("YYYY-MM-DDTHH:mm:ssZ[Z]")} | response seconds:${delta} | from: ${ctx.request.originalUrl}`);
  };
};
