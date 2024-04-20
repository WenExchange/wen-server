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
          const { slug, contract_address } = ctx.request.query;
          
          const filters = []
          if (slug) filters.push({
            slug
          })
          if (contract_address) filters.push({
            contract_address
          })

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
              populate: {
                nfts: {
                    sell_order:true
                }
              }
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
