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

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    // Test
    const testnetjsonRpcProvider = new ethers.providers.JsonRpcProvider(
      "https://rpc.ankr.com/blast_testnet_sepolia/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c"
    );
    // /** Wen Contract Listener */
    const wenContract = new ethers.Contract(
      "0xD75104c9C2aeC1594944c8F3a2858C62DEeaE91b",
      ExchangeContractABI.abi,
      testnetjsonRpcProvider
    );

    console.log("hihihi");
    const wcqm = WenContractQueueManager.getInstance(strapi);
    wenContract.on("*", async (event) => {
      console.log("here!", event);
      wcqm.addQueue(event);
    });
    
    const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
    if (isBOTServer) {
    }
  },

  async bootstrap({ strapi }) {
    try {
      
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
