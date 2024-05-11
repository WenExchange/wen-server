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
const PreprocessMintQueueManager = require("./queue-manager/PreprocessMintQueueManager");
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
      const ccm = CollectionCacheManager.getInstance(strapi);
      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
      // await listingCollectionScript({strapi, address: "0xd285f0dc83123cbbbfe52c79cb26e3bdd1450510",timeout: 5 * 1000 })
      await listingCollectionScript({strapi, address: "0xa3df6E247133AF7B0268051577B5DF643756fb51",timeout: 5 * 1000 })
      await nft_retry_metadata({strapi, contract_address: "0xf3a4c9ce8ae7ca1505c72a393b302870dd40b754"})
      await nft_retry_metadata({strapi, contract_address: "0x4e06c956cc25b90698ed913aed4c80e5797f9e8f"})

      if (isBOTServer) {
        const nmqm = NFTMintingQueueManager.getInstance(strapi);
        const tqm = TokenTransferQueueManager.getInstance(strapi);
        const excqm = ExchangeContractQueueManager.getInstance(strapi);
        const wcqm = WenContractQueueManager.getInstance(strapi);
        wenETHContractQueueManager.getInstance(strapi)
        PreprocessMintQueueManager.getInstance(strapi)

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
