"use strict";
require("dotenv").config();
const axios = require("axios");
const { ethers } = require("ethers");
const {
  SERVER_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
  BLACKLIST_TYPE,
  IPFS,
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
const { preprocess_mint_second, preprocess_mint, bulkDeleteBlacklistOnPreprocess, bulkDeleteBlacklistNFT, addPreprocess } = require("./cron/preprocess");
const { updateUserBatchOrderStatus } = require("./listener/updateUserBatchOrders");
const PreprocessMintQueueManager3 = require("./queue-manager/PreprocessMintQueueManager3");
const PreprocessMintQueueManager2 = require("./queue-manager/PreprocessMintQueueManager2");
const BlacklistCacheManager = require("./cache-managers/BlacklistCacheManager");
const { wait } = require("./utils/helpers");
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
      const bcm = BlacklistCacheManager.getInstance(strapi)
      // await bulkDeleteBlacklistOnPreprocess({strapi})
      // await bulkDeleteBlacklistNFT({strapi})

      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
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
    } catch (error) { }
  },
};

