"use strict";

/**
 * collection controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::collection.collection",
({ strapi }) => ({

    async getFindOneCollection(ctx) {
      {
        try {
          const { slug, contract_address, is_populate = false } = ctx.request.query;
          
          const filters = []
          if (slug) filters.push({
            slug
          })
          if (contract_address) filters.push({
            contract_address
          })

          const populate = is_populate ? {
            nfts: {
                sell_order:true
            }
          } : null

          const collection  = await strapi.db
            .query("api::collection.collection")
            .findOne({
              where: {
                $and: [
                    ...filters,
                    {
                        publishedAt: {
                            $notNull: true
                        }
                    }
                ]
              },
              populate
            });
            if (!collection) throw new Error("Not found")


            return ctx.body = collection
        } catch (error) {
            console.error(error.message)
        }
    }
    }
  })

);
