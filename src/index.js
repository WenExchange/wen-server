"use strict";
require("dotenv").config();
const axios = require("axios");

const {
  SERVER_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
} = require("./utils/constants");
const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");
const TokenTransferQueueManager = require("./queue-manager/TokenTransferQueueManager");
const ElementContractQueueManager = require("./queue-manager/ElementContractQueueManager");
const WenContractQueueManager = require("./queue-manager/WenContractQueueManager");
const wenETHContractQueueManager = require("./queue-manager/wenETHContractQueueManager");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const DiscordManager = require("./discord/DiscordManager");
const ExchangeContractQueueManager = require("./queue-manager/ExchangeContractQueueManager");
const NFTMintingQueueManager = require("./queue-manager/NFTMintingQueueManager");
dayjs.extend(utc);
dayjs.extend(timezone);

const { ethers } = require("ethers");
const ExchangeContractABI = require("./web3/abis/ExchangeContractABI.json");
const wenETH = require("./web3/abis/wenETH.json");
const { getNFTsAndUpdateOwnerOfNFTs } = require("./utils/updateOwner");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Test
    const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
    if (isBOTServer) {
    }
  },

  async bootstrap({ strapi }) {
    try {
      await getNFTsAndUpdateOwnerOfNFTs({strapi})
      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
      if (isBOTServer) {
        const nmqm = NFTMintingQueueManager.getInstance(strapi);
        const tqm = TokenTransferQueueManager.getInstance(strapi);
        const excqm = ExchangeContractQueueManager.getInstance(strapi);
        const ecqm = ElementContractQueueManager.getInstance(strapi);
        const wcqm = WenContractQueueManager.getInstance(strapi);
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
    const dm = DiscordManager.getInstance();
    const error = new Error("Server is closed");
    try {
      dm.logError({ error, identifier: "LifeCycle - Destory" });
    } catch (error) {}
  },
};
