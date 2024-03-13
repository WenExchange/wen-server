'use strict';

/**
 * nft controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::nft.nft', ({ strapi }) => ({
  
    async getNFTs(ctx) {
        {
            try {
                const {where, orderBy} = ctx.request.query
                const [entries, count] = await strapi.db.query('api::nft.nft').findWithCount({
                    ...ctx.request.query
                  });

                  return ctx.body = {
                    entries,
                    count
                  }

            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    }
  }));
