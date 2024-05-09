const {
  NFT_LOG_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
  EX_TYPE,
  jsonRpcProvider_cron,
  PREPROCESS_TYPE,
  DISCORD_INFO,
} = require("../utils/constants");
const { ethers } = require("ethers");

const DiscordManager = require("../discord/DiscordManager");
const PreprocessQueueManager = require("../queue-manager/PreprocessQueueManager");


const preprocess = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | preprocess");

  try {
    const pqm = PreprocessQueueManager.getInstance(strapi)
    if (!pqm.isValidAddingQueue) return
    
    const preprocesses = await strapi.db.query("api::preprocess.preprocess").findMany({
      where: {
        $and: [
          // {
          //   type: PREPROCESS_TYPE.MINT
          // },
          {
            try_count: {
              $gte: 1
            }
          },
          {
            try_count: {
              $lte: 3 
            }
          }
        ]
      },
       orderBy: [{ try_count: 'asc' },{ id: 'asc' }],
       populate: {
        nft: {
          populate: {
            collection: {
              select: ["contract_address"]
            }
          }
        },
       }
    })

    pqm.addQueueWithArray(preprocesses)

    strapi.log.info("[CRON TASK] - COMPLETE | preprocess");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG})
    strapi.log.error(`preprocess error- ${error.message}`);



  }
};

module.exports = {
  preprocess
};
