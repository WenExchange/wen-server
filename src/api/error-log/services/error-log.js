'use strict';

/**
 * error-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::error-log.error-log');
