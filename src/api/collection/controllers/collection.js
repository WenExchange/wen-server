"use strict";
require("dotenv").config();
const dayjs = require("dayjs");
const CryptoJS = require("crypto-js");

/**
 * collection controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = {
  getFeesFromCollections: async (ctx, next) => {
    try {
      const {
        wallet,
        twitter_id,
        twitter_name,
        twitter_profile_image,
        discord_id,
        ref_code,
      } = ctx.request.body.data;

      console.log(ctx.request.body.data);

      //   const bytes = CryptoJS.AES.decrypt(wallet, process.env.WEN_SECRET);
      //   const originalWallet = bytes.toString(CryptoJS.enc.Utf8);

      //   console.log({
      //     originalWallet,
      //     twitter_name,
      //     discord_id,
      //     ref_code,});
      //     const dm = DiscordManager.getInstance();
      //     const guild = await dm.getGuild(WEN_GUILD_ID)

      //     /** Check is valid discord member */
      //     let member = null
      //     try {
      //        member = await dm.getMember({guild, userId: discord_id})
      //     } catch (error) {

      //     }

      //     if (!member) {
      //       console.log(`[BOT ALERT] -- invalid discord id`)
      //       return next()
      //     }

      //     /** Check is valid active wallet */

      //     const mm = MoralisManager.getInstance()
      //     const isActiveWallet = await mm.checkWalletActivity(originalWallet)
      //     if (!isActiveWallet) {
      //       console.log(`[BOT ALERT] -- inactive wallet`)
      //       return next()
      //     }

      //       /** Check */
      //       const prevUsers = await strapi.entityService.findMany(
      //         "api::early-user.early-user",
      //         {
      //           filters: {
      //             "$or": [{
      //               twitter_id: {
      //                 "$eq":twitter_id
      //               }
      //             }, {
      //               discord_id: {
      //                 "$eq": discord_id
      //               }
      //             }]

      //           },

      //         }
      //       );

      //       if (prevUsers.length > 0) {
      //         ctx.body={
      //           ...prevUsers[0]
      //         }
      //         return
      //       }

      //         // find user
      //         const earlyUser = await strapi.entityService.findMany(
      //           "api::early-user.early-user",
      //           {
      //             filters: {
      //               wallet: {
      //                 "$eq": originalWallet
      //               }
      //             },

      //           }
      //         );

      //         if (earlyUser.length > 0){
      //           ctx.body={
      //             ...earlyUser[0]
      //           }
      //           return
      //         }

      //         function getRandomInt(min, max) {
      //           const minCeiled = Math.ceil(min);
      //           const maxFloored = Math.floor(max);
      //           return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
      //         }

      //         const invite_point = getRandomInt(3,10)* 100

      //         // create ref code
      //         const own_code = createRefCode()
      //         const addredEarlyUser = await strapi.entityService.create(
      //           "api::early-user.early-user",
      //           {
      //             data: {
      //               wallet: originalWallet,
      //               twitter_id,
      //               twitter_name,
      //               twitter_profile_image,
      //               discord_id,
      //               ref_code,
      //               own_code,
      //               is_wl: false,
      //               invite_point: ref_code ? invite_point: 0
      //             },
      //           }
      //         );

      //         //ref_code
      //         if (ref_code) {
      //           // rank
      //         }

      //         ctx.body={
      //           ...addredEarlyUser
      //         }
    } catch (err) {
      console.log(err);
      ctx.badRequest(err);
    }
  },
};
