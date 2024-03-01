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
const MoralisManager =  require("../../../Moralis/MoralisManager")
/**
 * A set of functions called "actions" for `early-access`
 */

const WEN_TWITTER_USER_ID = "1750532543798218752"
const WEN_GUILD_ID = "1205136052289806396"

const BLACKLIST = ["172.31.0.189" ,"172.31.56.146", "172.31.43.101"]


const getTwitterKeyByTime = () => {
  const currentSeconds = dayjs().second()
  if(currentSeconds % 4 === 0) {
    return {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      keyId: "1"
    }
  } else if (currentSeconds % 4 === 1) {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_2,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_2,
      keyId: "2"
    }
  } else if (currentSeconds % 4 === 2) {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_3,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_3,
      keyId: "3"
    }
  } else {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_4,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_4,
      keyId: "4"
    }
  }
}

// const getTwitterKeyByTime = () => {
//   const currentSeconds = dayjs().second()
//   if(currentSeconds % 2 === 0) {
//     return {
//       clientId: process.env.TWITTER_CLIENT_ID_2,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET_2,
//       keyId: "2"
//     }
//   } 
//    else {
//     return {
//       clientId: process.env.TWITTER_CLIENT_ID_4,
//       clientSecret: process.env.TWITTER_CLIENT_SECRET_4,
//       keyId: "4"
//     }
//   }
// }


const getTwitterKeyByKeyId = (keyId) => {
  if(keyId === "1") {
    return {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      keyId: "1"
    }
  } else if (keyId === "2") {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_2,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_2,
      keyId: "2"
    }
  }else if (keyId === "3") {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_3,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_3,
      keyId: "3"
    }
  } else {
    return {
      clientId: process.env.TWITTER_CLIENT_ID_4,
      clientSecret: process.env.TWITTER_CLIENT_SECRET_4,
      keyId: "4"
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
  originalWallet,
  twitter_name,
  discord_id,
  ref_code,});
  const dm = DiscordManager.getInstance();
  const guild = await dm.getGuild(WEN_GUILD_ID)

  /** Check is valid discord member */
  let member = null
  try {
     member = await dm.getMember({guild, userId: discord_id})
  } catch (error) {
    
  }

  if (!member) {
    console.log(`[BOT ALERT] -- invalid discord id`)
    return next()
  }

  /** Check is valid active wallet */

  const mm = MoralisManager.getInstance()
  const isActiveWallet = await mm.checkWalletActivity(originalWallet)
  if (!isActiveWallet) {
    console.log(`[BOT ALERT] -- inactive wallet`)
    return next()
  } 
  


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

  authActiveWallet:  async (ctx, next) => {
    try {
      const { wallet } = ctx.request.query;
      const bytes = CryptoJS.AES.decrypt( wallet, process.env.WEN_SECRET);
      const originalWallet = bytes.toString(CryptoJS.enc.Utf8);

      const mm = MoralisManager.getInstance()
      const isActiveWallet = await mm.checkWalletActivity(originalWallet)
      ctx.body={
        isActiveWallet
      }

    } catch (err) {
      console.log(err);
    }
  },

  authTwitter: async (ctx, next) => {
    const { callback_url } = ctx.request.query;
    const keys = getTwitterKeyByTime()
    try {
      const client = new TwitterApi({
        clientId: keys.clientId,
        clientSecret: keys.clientSecret,
      });

      const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
        callback_url,
        { scope: ["tweet.read", "users.read", "follows.write"] }
      );

      ctx.body = {
        url,
        codeVerifier,
        state,
        keyId: keys.keyId
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
      const keys = getTwitterKeyByKeyId(keyId)
      // const BEARER_TOKEN =
      const client = new TwitterApi({
        clientId: keys.clientId,
        clientSecret: keys.clientSecret,
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

  authDiscord: async (ctx, next) => {
    const { code, redirect_uri } = ctx.request.query;
    try {

           const tokenResponse = await axios
        .post("https://discord.com/api/oauth2/token", {
          client_id: process.env.DISCORD_CLIENT_ID_2,
          client_secret: process.env.DISCORD_CLIENT_SECRET_2,
          code,
          grant_type: "authorization_code",
          redirect_uri,
          scope: "identify guilds.join"
        }, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        })
        .then((res) => res.data);

            

      ctx.body = tokenResponse
    } catch (err) {
      console.log(err.message);
      // ctx.badRequest(err.message, err);
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
      const botToken = process.env.DISCORD_BOT_TOKEN_3
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


