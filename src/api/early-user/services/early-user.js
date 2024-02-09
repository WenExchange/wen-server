'use strict';

/**
 * early-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::early-user.early-user');
