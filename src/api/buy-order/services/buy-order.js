'use strict';

/**
 * buy-order service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::buy-order.buy-order');
