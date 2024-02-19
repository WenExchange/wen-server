'use strict';
require("dotenv").config();
const CryptoJS = require("crypto-js");
const voucher_codes = require('voucher-code-generator');
const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");
const fs = require('fs/promises');
const {createUniqueRefCode, createRefCode} = require("../../../earlyaccess/refCodeHandler")
/**
 * A set of functions called "actions" for `early-access`
 */

const WEN_TWITTER_USER_ID = "1750532543798218752"
const WEN_GUILD_ID = "1205136052289806396"

module.exports = {
  addEarlyUser: async (ctx, next) => {
    try {
      const {
        wallet,
        twitter_id,
        twitter_name,
        twitter_profile_image,
        discord_id,
        ref_code,
      } = ctx.request.body.data;
      console.log({ wallet,
        twitter_id,
        twitter_name,
        twitter_profile_image,
        discord_id,
        ref_code,});
      
      const bytes = CryptoJS.AES.decrypt( wallet, process.env.WEN_SECRET);
const originalWallet = bytes.toString(CryptoJS.enc.Utf8);

    /** Check */
    const prevUsers = await strapi.entityService.findMany(
      "api::early-user.early-user",
      {
        filters: {
          "or": [{
            twitter_id: {
              "$eq": twitter_id
            }
          }, {
            discord_id: {
              "$eq": discord_id
            }
          }]
         
        },
        
      }
    );

    
      // find user 
      const earlyUser = await strapi.entityService.findMany(
        "api::early-user.early-user",
        {
          filters: {
            wallet: {
              "$eq": originalWallet
            }
          },
          
        }
      );

      if (earlyUser.length > 0){
        ctx.body={
          ...earlyUser[0]
        }
        return 
      }

   

      if (prevUsers.length > 0) {
        ctx.body={
          ...prevUsers[0]
        }
        console.log(333, prevUsers.length);
        return 
      }




   
      function getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
      }

    
      const invite_point = getRandomInt(3,10)* 100 
    
      // create ref code
      const own_code = createRefCode()
      const addredEarlyUser = await strapi.entityService.create(
        "api::early-user.early-user",
        {
          data: {
            wallet: originalWallet,
            twitter_id,
            twitter_name,
            twitter_profile_image,
            discord_id,
            ref_code,
            own_code,
            invite_point: ref_code ? invite_point: 0
          },
        }
      );

      //ref_code
      if (ref_code) {
        // rank
      }

  
     

      ctx.body={
        ...addredEarlyUser
      }

    } catch (err) {
      console.log(err);
      ctx.badRequest(err);
    }
  },

  authTwitter: async (ctx, next) => {
    const { callback_url } = ctx.request.query;
    try {
      const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      });

      const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
        callback_url,
        { scope: ["tweet.read", "users.read", "follows.write"] }
      );

      ctx.body = {
        url,
        codeVerifier,
        state,
      };
    } catch (err) {
      console.log(err.message);
      ctx.badRequest(err.message, err);
    }
  },

  followTwitter: async (ctx, next) => {
    const { callback_url, code, codeVerifier } = ctx.request.query;
    try {
      const WEN_USER_ID = WEN_TWITTER_USER_ID;
      // const BEARER_TOKEN =
      const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      });

      const result = await client
        .loginWithOAuth2({ code, codeVerifier, redirectUri: callback_url })
        .then(
          ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
            // Example request
            return loggedClient.v2
              .me({
                "user.fields": ["profile_image_url"],
              })
              .then((userObject) => {
                return loggedClient.v2
                  .follow(userObject.data.id, WEN_USER_ID)
                  .then((res) => {
                    return {
                      accessToken,
                      refreshToken,
                      expiresIn,
                      ...userObject.data,
                    };
                  });
              });
          }
        );
      ctx.body = {
        ...result,
      };
    } catch (err) {
      console.log(err);
      ctx.badRequest(err, err);
    }
  },

  addUserToDiscord: async (ctx, next) => {
    const { access_token } = ctx.request.query;
    try {
      const user = await axios
        .get("https://discord.com/api/users/@me", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => res.data);
      const botToken = process.env.DISCORD_BOT_TOKEN
      const guildId = WEN_GUILD_ID;
      const url = `https://discord.com/api/guilds/${guildId}/members/${user.id}`;

      const headers = {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      };
      const member = await axios
        .put(
          url,
          {
            access_token: access_token,
          },
          {
            headers,
          }
        )
        .then((res) => res.data);
      ctx.body = {
        ...user,
        isAdded: member?.user ? true : false
      };
    } catch (err) {
      console.log(err);
      ctx.badRequest(err.message, err);
    }
  },

};
