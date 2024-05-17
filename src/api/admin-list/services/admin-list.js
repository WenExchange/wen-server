'use strict';

/**
 * admin-list service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::admin-list.admin-list');
