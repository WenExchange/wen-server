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

          console.log("exchange_user_id",exchange_user_id);

          const currentDistributionStatLog  = await strapi.db
            .query("api::airdrop-distribution-stat.airdrop-distribution-stat")
            .findOne({
              orderBy: {
                  snapshot_id: "desc"
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

    async getAirdropLeaderBoard(ctx) {
      {
        try {
          const { offset,limit } = ctx.request.query;

          const currentDistributionStatLog  = await strapi.db
            .query("api::airdrop-distribution-stat.airdrop-distribution-stat")
            .findOne({
              orderBy: {
                  snapshot_id: "desc"
              }
            });

          if (!currentDistributionStatLog) {
            throw new Error("Not found airdrop dashbord - distribution");
          }

       
          const snapshot_id = currentDistributionStatLog.snapshot_id
            const entry = await strapi.db.query('api::airdrop-stat-log.airdrop-stat-log').findMany({
                where: {
                  $and: [
                    {snapshot_id},
                    {
                      total_trade_point: {
                        $gt: 0
                      }
                    }
              
                  ]
                },
                populate: {
                  exchange_user: true
                },
                orderBy: {
                  total_trade_point: "desc"
                },
                offset,
                limit
              });

              return ctx.body = entry
        } catch (error) {
            console.error(error.message)
        }
    }
    },

    async getMyAirdropStatLog(ctx) {
      {
        try {
          const { exchange_user_id } = ctx.request.query;

          const currentDistributionStatLog  = await strapi.db
            .query("api::airdrop-distribution-stat.airdrop-distribution-stat")
            .findOne({
              orderBy: {
                  snapshot_id: "desc"
              }
            });

          if (!currentDistributionStatLog) {
            throw new Error("Not found airdrop dashbord - distribution");
          }

       
          const snapshot_id = currentDistributionStatLog.snapshot_id
            const entry = await strapi.db.query('api::airdrop-stat-log.airdrop-stat-log').findOne({
                where: {
                  $and: [
                   {
                    exchange_user: {
                      id: exchange_user_id
                    },
                    
                   },
                   {snapshot_id}
                  ]
                },
                populate: {
                  exchange_user: true
                }
              });

              if (!entry) throw new Error("Not fount")
           

              let count = await strapi.db.query("api::airdrop-stat-log.airdrop-stat-log").count({
                where: {
                  total_trade_point: {
                    $gt: entry.total_trade_point
                  }
                }
              })

              return ctx.body = {
                ...entry,
                rank: count + 1
              }
        } catch (error) {
            console.error(error.message)
        }
    }
    }
  })
);
