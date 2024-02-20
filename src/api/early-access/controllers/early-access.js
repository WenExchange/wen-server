'use strict';
require("dotenv").config();
const dayjs = require('dayjs')
const CryptoJS = require("crypto-js");
const voucher_codes = require('voucher-code-generator');
const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");
const fs = require('fs/promises');
const {createUniqueRefCode, createRefCode} = require("../../../earlyaccess/refCodeHandler")
const DiscordManager = require("../../../discord/DiscordManager");
/**
 * A set of functions called "actions" for `early-access`
 */

const WEN_TWITTER_USER_ID = "1750532543798218752"
const WEN_GUILD_ID = "1205136052289806396"

const BLACKLIST = ["172.31.0.189" ,"172.31.56.146", "172.31.43.101"]


const getTwitterKeyByTime = () => {
  const currentSeconds = dayjs().second()
  if(currentSeconds % 2 === 0) {
    return {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      keyId: "1"
    }
  } else {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_2,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_2,
      keyId: "2"
    }
  }
}

const getTwitterKeyByKeyId = (keyId) => {
  if(keyId === "1") {
    return {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      keyId: "1"
    }
  } else {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_2,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_2,
      keyId: "2"
    }
  }
}

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
     
      
      const bytes = CryptoJS.AES.decrypt( wallet, process.env.WEN_SECRET);
const originalWallet = bytes.toString(CryptoJS.enc.Utf8);

console.log({ 
  twitter_name,
  discord_id,
  ref_code,});

  console.log(`[Warning] - ${ctx.request?.ip}`);
  // if (ctx.request?.ip) {
  //   if (BLACKLIST.includes(ctx.request?.ip)) {
  //     console.log(`[BLOCK ALERT ]${ctx.request?.ip}`);
  //     return next()
      
  //   }
  // }



    /** Check */
    const prevUsers = await strapi.entityService.findMany(
      "api::early-user.early-user",
      {
        filters: {
          "$or": [{
            twitter_id: {
              "$eq":twitter_id
            }
          }, {
            discord_id: {
              "$eq": discord_id
            }
          }]
         
        },
        
      }
    );

    if (prevUsers.length > 0) {
      ctx.body={
        ...prevUsers[0]
      }
      return 
    }


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
        clientId: getTwitterKeyByTime().clientId,
        clientSecret: getTwitterKeyByTime().clientSecret,
      });

      const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
        callback_url,
        { scope: ["tweet.read", "users.read", "follows.write"] }
      );

      ctx.body = {
        url,
        codeVerifier,
        state,
        keyId: getTwitterKeyByTime().keyId
      };
    } catch (err) {
      console.log(err.message);
      // ctx.badRequest(err.message, err);
    }
  },

  followTwitter: async (ctx, next) => {
    const { callback_url, code, codeVerifier, keyId } = ctx.request.query;
    try {
      const WEN_USER_ID = WEN_TWITTER_USER_ID;
      // const BEARER_TOKEN =
      const client = new TwitterApi({
        clientId: getTwitterKeyByKeyId(keyId).clientId,
        clientSecret: getTwitterKeyByKeyId(keyId).clientSecret,
      });

      let result = await client
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
      ctx.response.status = 400
      ctx.response.message = "Bad request"
      if (err.code) {
        if (err.code === 429) {
          ctx.response.status = 429
          ctx.response.message = "Too many requests"
        }
      }
      console.log(err.code);
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

  checkIsMemberOfDiscord: async (ctx, next) => {
   
    try {
      const { access_token } = ctx.request.query;
      const dm = DiscordManager.getInstance();

      const user = await axios
        .get("https://discord.com/api/users/@me", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => res.data);

        const guild = await dm.getGuild(WEN_GUILD_ID)

        let member = null
        try {
           member = await dm.getMember({guild, userId: user.id})
        } catch (error) {
          
        }
        
        

      ctx.body = {
        ...user,
        isMember: member ? true : false
      };
    } catch (err) {
      console.log(err);
    }
  },

};


