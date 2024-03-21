

const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const axios = require("axios");
const {stats_1h_collection}  = require("./stat_collelction")
module.exports = {

  getETHUSDT: {
    task: async ({ strapi }) => {
      try {
       const priceInfo = await axios.get(`https://api.api-ninjas.com/v1/cryptoprice?symbol=ETHUSDT`, {
         headers: { 'X-Api-Key': 'RvlBPLkBQkQ323ebmaAnPA==0RUW8U3YEnJdRez7'}
       }).then(res => res.data)

       const updated = await strapi.entityService.update(
        "api::coin-price.coin-price",1,
        {
          data: {
            ...priceInfo
          }
        }
      );


      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `*/15 * * * * *`,
    },
  },
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