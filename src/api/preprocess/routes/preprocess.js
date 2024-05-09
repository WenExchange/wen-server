'use strict';

/**
 * preprocess router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::preprocess.preprocess');
