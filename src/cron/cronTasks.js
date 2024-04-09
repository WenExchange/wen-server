const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { stats_1h_collection } = require("./stat_collelction");
const {
  listing_cancel_detector_expiration,
  listing_cancel_detector_approve,
} = require("./listing_cancel_detector");
const { update_ether_price } = require("./update_ether_price");
const {
  claimAllBlastYieldFromWenTradePool,
  protocolFeeReceiverJob,
} = require("./stats_24h_contract");

const { airdropStatCombined } = require("./airdrop_jobs");

module.exports = {
  cacheCollection: {
    task: async ({ strapi }) => {
      strapi.log.info("[CRON TASK] cache collection address");
      try {
        const ccm = CollectionCacheManager.getInstance(strapi);
        await ccm.fetchAndUpdateCollections({ strapi });
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

  listing_cancel_detector_expiration: {
    task: listing_cancel_detector_expiration,
    options: {
      rule: `*/1 * * * *`,
    },
  },
  listing_cancel_detector_approve: {
    task: listing_cancel_detector_approve,
    options: {
      rule: `*/15 * * * *`,
    },
  },

  update_ether_price: {
    task: update_ether_price,
    options: {
      rule: `*/5 * * * *`,
    },
  },

  // protocolFeeReceiverJob: {
  //   task: protocolFeeReceiverJob,
  //   options: {
  //     rule: `0 22 * * *`,
  //     tz: "Asia/Seoul",
  //   },
  // },

  // claimAllBlastYieldFromWenTradePool: {
  //   task: claimAllBlastYieldFromWenTradePool,
  //   options: {
  //     rule: `0 23 * * *`,
  //     tz: "Asia/Seoul",
  //   },
  // },

  airdropStatCombined: {
    task: airdropStatCombined,
    options: {
      rule: `0 16 * * *`,
      tz: "Asia/Seoul",
    },
  },
};
