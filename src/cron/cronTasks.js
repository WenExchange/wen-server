// const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const wen = require("../web3/wen_contract.js");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3("https://rpc.ankr.com/blast_testnet_sepolia/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494");




module.exports = {
  ClaimAllYield: {
    task: async ({ strapi }) => {
      console.log("[WEN BOT] ClaimAllYield");
      try {
        const object = await wen
        .claimAllBlastYieldFromWenTradePool()
        const data = successYield(object);

        const dm = DiscordManager.getInstance();
        dm.logWenBotDiscordChannel({data})





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
        await dm.logWenBotDiscordChannel({data})

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
};

function successYield(object) {
  return {
    ...object,
    claimedETH: toEther(object.claimedETH).toString(),
    usedETHForGas: toEther(object.usedETHForGas).toString(),
    contractEthBalance: toEther(object.contractEthBalance).toString()
  }
}

function toEther(num) {
  return parseFloat(web3.utils.fromWei(num, "ether")).toFixed(18);
}

// function getCurrentDateTime() {
//   var options = {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//     timeZoneName: "short",
//     weekday: "short",
//   };
//   var date = new Date();
//   options.timeZone = "America/New_York";
//   return date.toLocaleDateString("en-US", options);
// }

