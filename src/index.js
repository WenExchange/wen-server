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
const DiscordManager = require("./discord/DiscordManager");
const ExchangeContractQueueManager = require("./queue-manager/ExchangeContractQueueManager");
const NFTMintingQueueManager = require("./queue-manager/NFTMintingQueueManager");
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
  

      // const mcqm = MintifyContractQueueManager.getInstance(strapi)
      const excqm = ExchangeContractQueueManager.getInstance(strapi)
      const ecqm = ElementContractQueueManager.getInstance(strapi)
      const wcqm = WenContractQueueManager.getInstance(strapi)
      const ccm = CollectionCacheManager.getInstance(strapi);

        createTransferListener({ strapi }).catch((e) => {
          strapi.log.error(`createTransferListener error - ${e.message}`);
        });
      }
    } catch (error) {
      strapi.log.error(`bootstrap error - ${error.message}`);
    }
  },

  async destroy() {
    const dm = DiscordManager.getInstance()
    const error = new Error("Server is closed")
    try {
      dm.logError({error, identifier: "LifeCycle - Destory"})
    } catch (error) {
      
    }
    
  }
};
