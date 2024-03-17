"use strict";

const { createTransferListener } = require("./listener/blockchainListener");
const CollectionCacheManager = require("./cache-managers/CollectionCacheManager");

const { update1hourStat } = require("./listener/collectionStats");
const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin
const { updateAllNftOwner } = require("./api/sdk/controllers/updateOwners");
const { stats_1h_collection } = require("./cron/stat_collelction");
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

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    try {
      const {uploadNFTImageWithFile, updateNFT} = require("./utils/UploadImages")
      // createTransferListener({ strapi });
      // uploadNFTImageWithFile({strapi})
      // updateNFT({strapi})
      const ccm = CollectionCacheManager.getInstance(strapi);
    } catch (error) {
      console.log(error.message);
    }
  },
};
