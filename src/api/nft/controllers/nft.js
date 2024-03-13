'use strict';

/**
 * nft controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::nft.nft', ({ strapi }) => ({
  
    async getNFTs(ctx) {
        {
            try {
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
           

        
    }, 
    async getNFT(ctx) {
        {
            try {
                const entry = await strapi.db.query('api::nft.nft').findOne({
                    ...ctx.request.query
                  });

                  return ctx.body = entry

            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    },

  }));
