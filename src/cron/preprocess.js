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
const { wait } = require("../utils/helpers");
const dayjs = require("dayjs");
const BlacklistCacheManager = require("../cache-managers/BlacklistCacheManager");


const preprocess_mint = async ({ strapi, pqm, offset = 0, limit = 1000 }) => {
  strapi.log.info("[CRON TASK] - START | preprocess");

  try {

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
      offset,
      limit
    })

    pqm.addQueueWithArray(preprocesses)

    strapi.log.info("[CRON TASK] - COMPLETE | preprocess");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({ error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG })
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
      limit: 1000
    })

    pqm.addSecondQueueWithArray(preprocesses)

    strapi.log.info("[CRON TASK] - COMPLETE | preprocess");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({ error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG })
    strapi.log.error(`preprocess error- ${error.message}`);



  }
};

const bulkDeleteBlacklistOnPreprocess = async ({ strapi }) => {
  const bcm = BlacklistCacheManager.getInstance(strapi)
  await bcm.fetchAndUpdateBlacklists({strapi})
  const blacklist = bcm.getBlacklistAddresses()
  const preprocesses = await strapi.db.query("api::preprocess.preprocess").findMany({
    where: {
      $or: [
        ...blacklist.map(contract_address => {
          return {
            nft: {
              collection: {
                contract_address
              }
            }
          }
        }),
        {
          nft: {
            id: {
              $null: true
            }
          }
        }

      ]


    }
  })

  console.log(`will delete processes ${preprocesses.length}`);

  const unit = 5
  for (let i = 0; i < preprocesses.length / unit; i++) {
    console.log(i * unit);

    for (let j = 0; j < unit; j++) {
      if (preprocesses.length - 1 < i * unit + j) break
      const preprocess = preprocesses[i * unit + j]


      strapi.db.query("api::preprocess.preprocess").delete({
        where: {
          id: preprocess.id
        }
      }).catch(e => {
        strapi.log.error(`bulkDeleteBlacklistOnPreprocess - ${e.message}`)
      })




    }
    await wait(0.2)



  }



}


const bulkDeleteBlacklistNFT = async ({ strapi }) => {
  const bcm = BlacklistCacheManager.getInstance(strapi)
  await bcm.fetchAndUpdateBlacklists({strapi})
  const blacklist = bcm.getBlacklistAddresses()
  const nfts = await strapi.db.query("api::nft.nft").findMany({
    where: {
      $or: blacklist.map(contract_address => {
        return {
          collection: {
            contract_address
          }
        }
      })


    }
  })

  console.log(`will delete nfts ${nfts.length}`);

  const unit = 5
  for (let i = 0; i < nfts.length / unit; i++) { //2.xx
    // 0 1 2 3 4
    console.log(i * unit);

    for (let j = 0; j < unit; j++) {
      if (nfts.length - 1 < i * unit + j) break


      const nft = nfts[i * unit + j]  // 2 * 5 
      strapi.db.query("api::nft.nft").delete({
        where: {
          id: nft.id
        }
      }).catch(e => {
        strapi.log.error(`bulkDeleteBlacklistOnPreprocess - ${e.message}`)
      })


    }
    await wait(0.2)



  }



}

const addPreprocess = async ({strapi, contract_address}) => {
  const collection =  await strapi.db.query("api::collection.collection").findOne({
    where: {
      contract_address
    },
  })

  const nfts = await strapi.db.query("api::nft.nft").findMany({
    where: {
      collection: {
        contract_address
      }
    },
  })


  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    await strapi.db.query("api::preprocess.preprocess")
          .create({
            data: {
              type: PREPROCESS_TYPE.MINT,
              nft: nft.id,
              collection: collection.id,
              try_count: 1,
              timestamp: dayjs().unix()
            }
          })
    
  }
  
}

module.exports = {
  preprocess_mint,
  preprocess_mint_second,
  bulkDeleteBlacklistOnPreprocess,
  bulkDeleteBlacklistNFT,
  addPreprocess

};
