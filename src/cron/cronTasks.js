

const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const {stats_1h_collection}  = require("./stat_collelction")
module.exports = {
  cacheCollection: {
    task: async ({ strapi }) => {
      console.log("[CRON TASK] cache collection address");
      try {

        const ccm = CollectionCacheManager.getInstance(strapi)
        await ccm.fetchAndUpdateCollections({strapi})


      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `*/1 * * * *`,
    },
  },
  stats_1h_collection: {
    task: stats_1h_collection,
    options: {
      rule: `00 * * * *`,
      tz: "Asia/Seoul",
    },
  },

  stats_24h_Collection: {
    task: async ({ strapi }) => {
      console.log("[CRON TASK] 24H COLLECTION STATS");
      try {
        
      }
        
        catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `00 00 * * *`,
      tz: "Asia/Seoul",
    },
  },



};