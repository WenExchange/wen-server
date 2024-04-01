"use strict";
require("dotenv").config();
const {
  SERVER_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
} = require("./utils/constants");
const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const { listingCollectionScript } = require("./utils/listing-script");
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  updateSalePoint,
  updateListingPoint,
} = require("./utils/airdropPrePointHelper");

const { createAirdropStat } = require("./cron/airdrop_jobs");

const { ethers } = require("ethers");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    // const userA = "0x0000000002c0fd34c64a4813d6568abf13b0adda";
    // const userB = "0x4123B6B29006Ed7160B2EEDB89A0c062F976b511";
    // const userC = "0x0001905eb0e97df81b0b4c7f0d9e6f1035e317ca";
    // const plutoCat = "0xf084962cdc640ed5c7d4e35e52929dac06b60f7c";
    // const paymentToken = "0xf084962cdc640ed5c7d4e35e52929dac06b60f7c";

    // await updateListingPoint(false, userA, plutoCat, 33, 2, 125082, { strapi });
    // await updateListingPoint(false, userB, plutoCat, 120, 2.148, 125082, {
    //   strapi,
    // });
    // await updateListingPoint(false, userC, plutoCat, 234, 2.548, 125082, {
    //   strapi,
    // });
    // await updateListingPoint(false, userC, plutoCat, 1000, 4.548, 125082, {
    //   strapi,
    // });

    // await updateSalePoint(paymentToken, 0.001, userA, plutoCat, 100, 126348, {
    //   strapi,
    // });
    // await updateSalePoint(paymentToken, 0.01, userB, plutoCat, 200, 126348, {
    //   strapi,
    // });
    // await updateSalePoint(paymentToken, 0.1, userC, plutoCat, 300, 126348, {
    //   strapi,
    // });
    // await updateSalePoint(paymentToken, 1, userC, plutoCat, 400, 126348, {
    //   strapi,
    // });

    // await createAirdropStat({ strapi });

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
