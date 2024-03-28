"use strict";
require("dotenv").config();
const {SERVER_TYPE, jsonRpcProvider} = require("./utils/constants")
const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");
const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const { getNFTsAndUpdateOwnerOfNFTs, getNFTsAndAddOwnerOfNFTs, deleteOrders } = require("./utils/updateOwner");
dayjs.extend(utc);
dayjs.extend(timezone);
module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    try {
      getNFTsAndUpdateOwnerOfNFTs({strapi})
      // getNFTsAndAddOwnerOfNFTs({strapi})
      // deleteOrders({strapi})
      const isBOTServer = process.env.SERVER_TYPE === SERVER_TYPE.BOT
      if (isBOTServer) {
        createTransferListener({ strapi }).catch(e => { 
          console.error(`createTransferListener error - ${e.message}`)
        });
        const ccm = CollectionCacheManager.getInstance(strapi);

       
      }
    } catch (error) {
      console.log(`bootstrap error - ${error.message}`);
    }
  },
};
