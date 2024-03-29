"use strict";
require("dotenv").config();
const { SERVER_TYPE, jsonRpcProvider } = require("./utils/constants");
const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  mintifyContractListener,
} = require("./listener/mintifyContractListener");

const { ethers } = require("ethers");

const SeportABI = require("./web3/abis/Seaport.json");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    const mintifyContract = new ethers.Contract(
      "0x00000000000000adc04c56bf30ac9d3c0aaf14dc",
      SeportABI.abi,
      jsonRpcProvider
    );
    mintifyContract.on("*", async (event) => {
      try {
        await mintifyContractListener({ event, strapi });
      } catch (error) {
        console.error(`elementContractListener error - ${error}`);
      }
    });

    try {
      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT;
      if (isBOTServer) {
        createTransferListener({ strapi }).catch((e) => {
          console.error(`createTransferListener error - ${e.message}`);
        });
        const ccm = CollectionCacheManager.getInstance(strapi);
      }
    } catch (error) {
      console.log(`bootstrap error - ${error.message}`);
    }
  },
};
