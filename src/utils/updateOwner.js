const { jsonRpcProvider, jsonRpcProvider_cron, DISCORD_INFO, NFT_LOG_TYPE } = require("./constants");
const { ethers } = require("ethers");
const IERC721 = require("../api/sdk/controllers/IERC721");
const { getISOString } = require("./helpers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const { updateListingPoint } = require("./airdropPrePointHelper");
const { updateFloorPrice, updateOrdersCount } = require("../listener/collectionStats");

const getNFTsAndUpdateOwnerOfNFTs = async ({ strapi, isGT = true }) => {
  const seconds_1h = 60 * 60
  const seconds_1d = seconds_1h * 24


  const collections = await strapi.db.query("api::collection.collection").findMany({
      where: {
        
          $and: [
            {
              publishedAt: {
                  $notNull: true
                }
            },
            {
              is_launchpad: false
            }

        ]
        
          
      },
      orderBy: [{"volume_24h": "desc"}],
      offset: 0,
      limit: 35,
      select: ["contract_address", "name"],
    
  })

  const launchpad_collections = await strapi.db.query("api::collection.collection").findMany({
    where: {
        is_launchpad: true
        
    },
    select: ["contract_address", "name"],
  
})

const batchCollections = [...collections, ...launchpad_collections]

  console.log(batchCollections);

  for (let j = 0; j < batchCollections.length; j++) {
    const batchCollection = batchCollections[j];

    let totalUpdatedCount = 0
    const unit = 10
  for (let i = 0; i < 100000 / unit; i++) {
    console.log(`${i} start`);
    const start = i * unit
    const end = unit * (i + 1)

    const batchNFTs = await strapi.db.query("api::nft.nft").findMany({
      populate: {
        collection: {
          select: ["contract_address"]
        },
        sell_order: {
          select: ["id"]
        }
      },
      where: {
        collection: {
          contract_address: batchCollection.contract_address
        }
      },
      offset: start,
      limit: unit
    })
    if (batchNFTs.length <= 0) break
    try {
      const updatedCount = await updateOwnerOfNFTs({ strapi, nfts: batchNFTs })
      totalUpdatedCount += updatedCount
    } catch (error) {
      console.error(`error - ${error.message}`)
    }



  }
  
  }
  
}


const updateOwnerOfNFTs = async ({ strapi, nfts }) => {
  const dm = DiscordManager.getInstance(strapi)
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    const collectionContract = new ethers.Contract(
      nft.collection.contract_address,
      IERC721.abi,
      jsonRpcProvider_cron
    );

    const realOwner = await collectionContract.ownerOf(nft.token_id)
    try {
      if (realOwner.toLowerCase() !== nft.owner.toLowerCase()) {
        dm.logError({ error: new Error(`name:${nft.name} | token id: ${nft.token_id} | prev:${nft.owner} | real:${realOwner}`), identifier: `updateOwnerOfNFTs`, channelId: DISCORD_INFO.CHANNEL.ERROR_LOG }).catch()
        strapi.log.info(`collection: ${nft.collection.contract_address} | token id: ${nft.token_id} | prev:${nft.owner} -> real:${realOwner}`)
        await strapi.entityService.update("api::nft.nft", nft.id, {
          data: {
            owner: realOwner,
          },
        });


        if (nft.sell_order) {
          const deletedOrder = await strapi.entityService
            .delete("api::order.order", nft.sell_order.id)

          if (deletedOrder) {
            strapi.entityService
              .create("api::nft-trade-log.nft-trade-log", {
                data: {
                  type: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_LISTING,
                  from: deletedOrder.maker,
                  nft: nft.id,
                  timestamp: dayjs().unix(),
                },
              }).catch((e) => console.error(e.message));
            try {
              await updateListingPoint(
                true,
                deletedOrder.maker,
                nft.collection.contract_address,
                nft.token_id,
                0,
                0,
                { strapi }
              )
              await updateFloorPrice({ strapi }, nft.collection.contract_address)
              await updateOrdersCount({ strapi }, nft.collection.contract_address);
            } catch (error) {
              strapi.log.error(`updateOwnerOfNFTs - ${error.message}`)
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`${nft.id} error - ${error.message}`);
      return null;
    }

  }
};


module.exports = {
  getNFTsAndUpdateOwnerOfNFTs,
  updateOwnerOfNFTs,
};
