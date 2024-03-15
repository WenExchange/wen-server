'use strict';

/**
 * coin-price service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::coin-price.coin-price');
