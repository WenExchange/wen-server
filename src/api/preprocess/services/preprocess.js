'use strict';

/**
 * preprocess service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::preprocess.preprocess');
