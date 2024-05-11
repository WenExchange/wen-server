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
const PreprocessMintQueueManager = require("../queue-manager/PreprocessMintQueueManager");


const preprocess_mint = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | preprocess");

  try {
    const pqm = PreprocessMintQueueManager.getInstance(strapi)
    if (!pqm.isValidAddingQueue()) return
    
    const preprocesses = await strapi.db.query("api::preprocess.preprocess").findMany({
      where: {
        $and: [
          {
            type: PREPROCESS_TYPE.MINT
          },
          {
            try_count: 1
          },
        ]
      },
       orderBy: [{ id: 'asc' }],
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
  preprocess_mint
};
