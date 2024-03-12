'use strict';

/**
 * nft controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::nft.nft', ({ strapi }) => ({
  
    async getNFTs(ctx) {
        console.log(333, "ctx.request.query",ctx.request.query);
        {
            try {
                const {where, orderBy} = ctx.request.query
                const [entries, count] = await strapi.db.query('api::nft.nft').findWithCount({
                    ...ctx.request.query,
                    where: JSON.parse(where),
                    orderBy: JSON.parse(orderBy)
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
