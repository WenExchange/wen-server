"use strict";


const { createTransferListener } = require("./listener/blockchainListener");

const { update1hourStat } = require("./listener/collectionStats");
const dayjs = require("dayjs");
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)
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
      const {
        findBots,
        checkIsValidTwitterUser,
        checkIsValidIDiscordUser,
        checkOGPass,
        checkOGPassWithWalletList,
        checkOGPassWithTwitterId,
      } = require("./utils/botCheckers");
      const { addCollelctions } = require("./utils/addCollection");
      // addCollelctions({strapi})
      // 32000
      // checkOGPassWithWalletList({strapi})
      // checkOGPassWithTwitterId({strapi})

      // checkIsValidIDiscordUser({strapi, start: 30000, limit: 60000})

      // checkIsValidIDiscordUser({strapi, start: 3000, limit: 1000})
      // checkIsValidIDiscordUser({strapi, start: 52000, limit: 10000})
      // await checkIsValidTwitterUser({strapi,start: 100000, limit: 1})
      // console.log(333, users.length);
      // findBots(strapi)
      // deleteBotUsers(strapi)
      // await update1hourStat(
      //   { strapi },
      //   "0x7E3D4B14E191533B44470889b6d0d36F232de1A3"
      // );
      createTransferListener({ strapi });
    } catch (error) {
      console.log(error.message);
    }
  },
};
