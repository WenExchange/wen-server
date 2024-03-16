
const DiscordManager = require("../discord/DiscordManager");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const wen = require("../web3/wen_contract.js");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://rpc.ankr.com/blast_testnet_sepolia/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494");
const {telegramClient} = require("../telegram/TelegramClient");
const axios = require("axios");
const chatId = process.env.TELEGRAM_CHAT_ID;
const {NFT_LOG_TYPE} = require("../utils/constants")
const {stats_1h_collection}  = require("./stat_collelction")
module.exports = {

  ClaimAllYield: {
    task: async ({ strapi }) => {
      console.log("[WEN BOT] ClaimAllYield");
      try {
        const object = await wen
        .claimAllBlastYieldFromWenTradePool()
        const data = successYield(object);

        const dm = DiscordManager.getInstance();
        dm.logWenBotDiscordChannel({data}).catch(error => console.error(error.message))
        logTelegram({data}).catch(error => console.error(error.message))
      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `00 23 * * *`,
      tz: "Asia/Seoul",
    },
  },
  ClaimAllYield2: {
    task: async ({ strapi }) => {
      console.log("[WEN BOT] ClaimAllYield");
      try {
        const object = await wen
        .claimAllBlastYieldFromWenTradePool()
        const data = successYield(object);

        const dm = DiscordManager.getInstance();
        dm.logWenBotDiscordChannel({data}).catch(error => console.error(error.message))
        logTelegram({data}).catch(error => console.error(error.message))

      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `00 11 * * *`,
      tz: "Asia/Seoul",

    },
  },
  ClaimGasFee: {
    task: async ({ strapi }) => {
      try {
        console.log("[WEN BOT] ClaimGasFee");
      
        await wen
        .claimAllGasFees()
        .then((object) => {
          return wen
            .distributeGasFees()
     
        })

      } catch (error) {
        console.error(error.message);
        // errorJob(e, "distributeGasFees error");
      }
    },
    options: {
      rule: `50 23 * * *`,
      tz: "Asia/Seoul",
    },
  },

  getETHUSDT: {
    task: async ({ strapi }) => {
      try {
       const priceInfo = await axios.get(`https://api.api-ninjas.com/v1/cryptoprice?symbol=ETHUSDT`, {
         headers: { 'X-Api-Key': 'RvlBPLkBQkQ323ebmaAnPA==0RUW8U3YEnJdRez7'}
       }).then(res => res.data)

       const updated = await strapi.entityService.update(
        "api::coin-price.coin-price",1,
        {
          data: {
            ...priceInfo
          }
        }
      );


      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `*/15 * * * * *`,
    },
  },
  cacheCollection: {
    task: async ({ strapi }) => {
      console.log("[CRON TASK] cache collection address");
      try {

        const ccm = CollectionCacheManager.getInstance(strapi)
        await ccm.fetchAndUpdateCollections({strapi})


      } catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `*/10 * * * *`,
    },
  },
  stats_1h_collection: {
    task: stats_1h_collection,
    options: {
      rule: `00 * * * *`,
      tz: "Asia/Seoul",
    },
  },

  stats_24h_Collection: {
    task: async ({ strapi }) => {
      console.log("[CRON TASK] 24H COLLECTION STATS");
      try {
        
      }
        
        catch (error) {
        console.error(error.message);
      }
    },
    options: {
      rule: `00 00 * * *`,
      tz: "Asia/Seoul",
    },
  },



};

function successYield(object) {
  return {
    ...object,
    claimedETH: toEther(object.claimedETH).toString(),
    usedETHForGas: toEther(object.usedETHForGas).toString(),
    contractEthBalance: toEther(object.contractEthBalance).toString()
  }
}

const logTelegram = async ({data}) => {
  const msg = `

<b>\n Just Claimed Blast Native Yield!🌾</b> 

✰ <code>Date</code> 
 ➯${getCurrentDateTime()}
✰ <code>Claimed ETH</code> 
 ➯${data.claimedETH} ETH
✰ <code>Used Gas</code> 
 ➯${data.usedETHForGas} ETH
✰ <code>Wen Trade Pool Balance</code> 
 ➯${data.contractEthBalance} ETH

<a href="https://testnet.blastscan.io/tx/${data.txHash}">View The TX 🔗</a>

🔗 Official Links
<a href="https://wen.exchange">Wen Website</a>  |  <a href="https://twitter.com/wen_exchange">X</a>  |  <a href="https://docs.wen.exchange">Docs</a>

`;

  await telegramClient.sendMessage(chatId, msg, { parse_mode: "HTML" });
}

function toEther(num) {
  return parseFloat(web3.utils.fromWei(num, "ether")).toFixed(18);
}


function getCurrentDateTime() {
  var options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZoneName: "short",
    weekday: "short",
  };
  var date = new Date();
  options.timeZone = "America/New_York";
  return date.toLocaleDateString("en-US", options);
}
