'use strict';

/**
 * exchange-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::exchange-user.exchange-user');
