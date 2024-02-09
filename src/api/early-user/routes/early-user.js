'use strict';

/**
 * early-user router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::early-user.early-user');
