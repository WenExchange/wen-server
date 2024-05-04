'use strict';

/**
 * error-log controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::error-log.error-log');
