"use strict";
require("dotenv").config();
const axios = require("axios");
const {ethers} = require("ethers");
const {
  SERVER_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
} = require("./utils/constants");
const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");
const TokenTransferQueueManager = require("./queue-manager/TokenTransferQueueManager");
const WenContractQueueManager = require("./queue-manager/WenContractQueueManager");
const wenETHContractQueueManager = require("./queue-manager/wenETHContractQueueManager");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const DiscordManager = require("./discord/DiscordManager");
const ExchangeContractQueueManager = require("./queue-manager/ExchangeContractQueueManager");
const NFTMintingQueueManager = require("./queue-manager/NFTMintingQueueManager");
const { listingCollectionScript } = require("./utils/listing-script");
const { nft_retry_metadata } = require("./cron/nft_retry");
const { getNFTsAndUpdateOwnerOfNFTs } = require("./utils/updateOwner");
const { listing_cancel_detector_expiration } = require("./cron/listing_cancel_detector");
const { collectionDeployerERC721And1155Listener } = require("./listener/collectionDeployerERC721And1155Listener");
const PreprocessQueueManager = require("./queue-manager/PreprocessQueueManager");
const { transferListener } = require("./listener/transferListener");
const { preprocess } = require("./cron/preprocess");
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
      
      /** TEST */
      PreprocessQueueManager.getInstance(strapi)
      let filter = {
        topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
      };

      jsonRpcProvider.on(filter, async (log, _) => {
        await transferListener({log, strapi})
      });

      // mint 10
      // process
      setInterval(() => {
        preprocess({strapi})
      }, 1000 * 60);
      

       /** TEST */

      const ccm = CollectionCacheManager.getInstance(strapi);
      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
      if (isBOTServer) {
        const nmqm = NFTMintingQueueManager.getInstance(strapi);
        const tqm = TokenTransferQueueManager.getInstance(strapi);
        const excqm = ExchangeContractQueueManager.getInstance(strapi);
        const wcqm = WenContractQueueManager.getInstance(strapi);
        wenETHContractQueueManager.getInstance(strapi)
        PreprocessQueueManager.getInstance(strapi)

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
