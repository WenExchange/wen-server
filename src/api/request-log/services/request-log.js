'use strict';

/**
 * request-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::request-log.request-log');
