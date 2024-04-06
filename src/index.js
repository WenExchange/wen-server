"use strict";
require("dotenv").config();
const {
  SERVER_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
} = require("./utils/constants");
const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");
const TokenTransferQueueManager = require("./queue-manager/TokenTransferQueueManager")
const MintifyContractQueueManager = require("./queue-manager/MintifyContractQueueManager")
const ElementContractQueueManager = require("./queue-manager/ElementContractQueueManager")
const WenContractQueueManager = require("./queue-manager/WenContractQueueManager")

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
    if (isBOTServer) {
    }
  },

  async bootstrap({ strapi }) {
    try {
      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
      if (isBOTServer) {
        const tqm = TokenTransferQueueManager.getInstance(strapi)
      const mcqm = MintifyContractQueueManager.getInstance(strapi)
      const ecqm = ElementContractQueueManager.getInstance(strapi)
      const wcqm = WenContractQueueManager.getInstance(strapi)
      const ccm = CollectionCacheManager.getInstance(strapi);

        createTransferListener({ strapi }).catch((e) => {
          console.error(`createTransferListener error - ${e.message}`);
        });
      }
    } catch (error) {
      console.log(`bootstrap error - ${error.message}`);
    }
  },
};
