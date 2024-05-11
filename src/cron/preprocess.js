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
       },
       offset: 0,
       limit: 20000
    })

    pqm.addQueueWithArray(preprocesses)

    strapi.log.info("[CRON TASK] - COMPLETE | preprocess");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG})
    strapi.log.error(`preprocess error- ${error.message}`);



  }
};

const preprocess_mint_second = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | second preprocess");

  try {
    const pqm = PreprocessMintQueueManager.getInstance(strapi)
    if (!pqm.isValidSecondAddingQueue()) return
    
    const preprocesses = await strapi.db.query("api::preprocess.preprocess").findMany({
      where: {
        $and: [
          {
            type: PREPROCESS_TYPE.MINT
          },
          {
            try_count: 2
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
       },
       offset: 0,
       limit: 20000
    })

    pqm.addSecondQueueWithArray(preprocesses)

    strapi.log.info("[CRON TASK] - COMPLETE | preprocess");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG})
    strapi.log.error(`preprocess error- ${error.message}`);



  }
};

const deleteBlacklistOnPreprocess = async ({strapi}) => {
  const blacklist = ["0x0AAADCf421A3143E5cB2dDB8452c03ae595B0734", "0xe91a42e3078c6ad358417299e4300683de87f971","0x65621a6a2cdB2180d3fF89D5dD28b19BB7Dd200a" ]
  const preprocesses = await strapi.db.query("api::preprocess.preprocess").findMany({
    where: {
      $or: blacklist.map(contract_address => {
        return {
          nft: {
            collection: {
              contract_address
            }
          }
        }
      })
      
      
    }
  })

  console.log(333,"will delete count", preprocesses.length);

  for (let i = 0; i < preprocesses.length; i++) {
    const preprocess = preprocesses[i];
    console.log(i);
    await strapi.db.query("api::preprocess.preprocess").delete({
      where: {
        id: preprocess.id
      }
    })
    
  }
}

module.exports = {
  preprocess_mint,
  preprocess_mint_second,
  deleteBlacklistOnPreprocess
  
};
