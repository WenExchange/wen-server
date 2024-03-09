'use strict';

/**
 * batch-signed-order service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::batch-signed-order.batch-signed-order');
