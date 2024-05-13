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

const deleteBlacklistOnPreprocess = async ({ strapi, isIterateReverse = false }) => {
  const blacklist = ["0x0c21c610acc756c9b1e157ac90a3e928e5b764a4","0x338BCe2590495B6DE6a7D7aC8514Ad73E7Be0FFB", "0x0AAADCf421A3143E5cB2dDB8452c03ae595B0734", "0xe91a42e3078c6ad358417299e4300683de87f971", "0x65621a6a2cdB2180d3fF89D5dD28b19BB7Dd200a", "0x73A0469348BcD7AAF70D9E34BBFa794deF56081F"]
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

  console.log(`will delete processes ${preprocesses.length}`);

  const unit = 5
  for (let i = 0; i < preprocesses.length / unit; i++) {
    // 0 1 2 3 4

    const preprocess = preprocesses[i];
    console.log(i);
    await strapi.db.query("api::preprocess.preprocess").delete({
      where: {
        id: preprocess.id
      }
    })

  }


  if (!isIterateReverse) {
    for (let i = 0; i < preprocesses.length; i++) {
      const preprocess = preprocesses[i];
      console.log(i);
      await strapi.db.query("api::preprocess.preprocess").delete({
        where: {
          id: preprocess.id
        }
      })

    }
  } else {
    for (let i = 0; i < preprocesses.length; i++) {
      const preprocess = preprocesses[preprocesses.length - 1 - i];
      console.log(i);
      await strapi.db.query("api::preprocess.preprocess").delete({
        where: {
          id: preprocess.id
        }
      })

    }
  }

}

const bulkDeleteBlacklistOnPreprocess = async ({ strapi }) => {
  const blacklist = ["0x0c21c610acc756c9b1e157ac90a3e928e5b764a4","0x338BCe2590495B6DE6a7D7aC8514Ad73E7Be0FFB", "0x0AAADCf421A3143E5cB2dDB8452c03ae595B0734", "0xe91a42e3078c6ad358417299e4300683de87f971", "0x65621a6a2cdB2180d3fF89D5dD28b19BB7Dd200a", "0x73A0469348BcD7AAF70D9E34BBFa794deF56081F"]
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
  const blacklist = ["0x0c21c610acc756c9b1e157ac90a3e928e5b764a4","0x338BCe2590495B6DE6a7D7aC8514Ad73E7Be0FFB", "0x0AAADCf421A3143E5cB2dDB8452c03ae595B0734", "0xe91a42e3078c6ad358417299e4300683de87f971", "0x65621a6a2cdB2180d3fF89D5dD28b19BB7Dd200a", "0x73A0469348BcD7AAF70D9E34BBFa794deF56081F"]
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

module.exports = {
  preprocess_mint,
  preprocess_mint_second,
  deleteBlacklistOnPreprocess, bulkDeleteBlacklistOnPreprocess,
  bulkDeleteBlacklistNFT

};
