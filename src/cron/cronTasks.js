const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { stats_1h_collection } = require("./stat_collelction");
const {
  listing_cancel_detector_expiration,
  listing_cancel_detector_approve,
} = require("./listing_cancel_detector");
const {offer_cancel_detector} = require("./offer_cancel_detector")
const { update_ether_price } = require("./update_ether_price");
const {
  claimAllBlastYieldFromWenTradePool,
  protocolFeeReceiverJob,
} = require("./stats_24h_contract");

const { airdropStatCombined } = require("./airdrop_jobs");
const { preprocess_mint, preprocess_mint_second } = require("./preprocess");
const PreprocessMintQueueManager = require("../queue-manager/PreprocessMintQueueManager");
const PreprocessMintQueueManager2 = require("../queue-manager/PreprocessMintQueueManager2");
const PreprocessMintQueueManager3 = require("../queue-manager/PreprocessMintQueueManager3");
const BlacklistCacheManager = require("../cache-managers/BlacklistCacheManager");
const { capyJobs } = require("./capybara_jobs");

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
      rule: `*/5 * * * *`,
    },
  },
  cacheBlacklist: {
    task: async ({ strapi }) => {
      strapi.log.info("[CRON TASK] cache blacklist");
      try {
        const bcm = BlacklistCacheManager.getInstance(strapi);
        await bcm.fetchAndUpdateBlacklists({ strapi });
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
  offer_cancel_detector: {
    task: offer_cancel_detector,
    options: {
      rule: `*/1 * * * *`,
    },
  },
  preprocess: {
    task: async ({ strapi }) => {
      try {
        const pqm = PreprocessMintQueueManager.getInstance(strapi)
      const pqm2 = PreprocessMintQueueManager2.getInstance(strapi)
      const pqm3 = PreprocessMintQueueManager3.getInstance(strapi)

      preprocess_mint({strapi,pqm })
      preprocess_mint({strapi, pqm: pqm2, offset: 1000})
      preprocess_mint({strapi, pqm: pqm3, offset: 2000})
      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `*/5 * * * *`,
    },
  },

  preprocess_second: {
    task: preprocess_mint_second,
    options: {
      rule: `*/10 * * * *`,
    },
  },

  update_ether_price: {
    task: update_ether_price,
    options: {
      rule: `*/5 * * * *`,
    },
  },

  protocolFeeReceiverJob: {
    task: protocolFeeReceiverJob,
    options: {
      rule: `0 22 * * *`,
      tz: "Asia/Seoul",
    },
  },

  claimAllBlastYieldFromWenTradePool: {
    task: claimAllBlastYieldFromWenTradePool,
    options: {
      rule: `0 23 * * *`,
      tz: "Asia/Seoul",
    },
  },

  airdropStatCombined: {
    task: airdropStatCombined,
    options: {
      rule: `0 16 * * *`,
      tz: "Asia/Seoul",
    },
  },

  capybaraJobs: {
    task: capyJobs,
    options: {
      rule: `* * * * *`, // FIXME: JOYCE 시간 바꿔주세요
      tz: "Asia/Seoul",
    },
  }
};
