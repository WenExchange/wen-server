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
          const { slug } = ctx.request.query;

          const collection  = await strapi.db
            .query("api::collection.collection")
            .findOne({
              where: {
                $and: [
                    {
                        slug
                    },
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
