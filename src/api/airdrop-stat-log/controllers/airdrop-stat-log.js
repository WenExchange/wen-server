'use strict';

/**
 * airdrop-stat-log controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::airdrop-stat-log.airdrop-stat-log', 
({ strapi }) => ({

    async getSpringAirdropDashboardData(ctx) {
      {
        try {
          const { exchange_user_id } = ctx.request.query;

          const currentDistributionStatLog  = await strapi.db
            .query("api::airdrop-distribution-stat.airdrop-distribution-stat")
            .findOne({
              orderBy: {
                  shapshot_id: "desc"
              }
            });

          if (!currentDistributionStatLog) {
            throw new Error("Not found airdrop dashbord - distribution");
          }

          const snapshot_id = currentDistributionStatLog.snapshot_id

          const airdropStatLog = await strapi.db
          .query("api::airdrop-stat-log.airdrop-stat-log")
          .findOne({
            where: {
                $and: [
                    {  snapshot_id,},
                    {
                        exchange_user: {
                            id: exchange_user_id
                        }
                    }
                ]
            }
          });

          if (!airdropStatLog) {
            throw new Error("Not found airdrop dashbord - stat log");
          }

          return (ctx.body = {
            success: true,
            currentDistributionStatLog,
            airdropStatLog
          });
        } catch (error) {
          console.error(error.message);
        }
      }
    },
  })
);
