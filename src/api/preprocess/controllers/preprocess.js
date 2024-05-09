'use strict';

/**
 * preprocess controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::preprocess.preprocess');
