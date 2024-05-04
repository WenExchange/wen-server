const {
  NFT_LOG_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
  EX_TYPE,
  jsonRpcProvider_cron,
} = require("../utils/constants");
const { ethers } = require("ethers");

const DiscordManager = require("../discord/DiscordManager");
const ERC721 = require("../web3/abis/ERC721.json");
const { fetchMetadata } = require("../listener/listingAtMint");


const nft_retry_metadata = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | NFT RETRY - Metadata");
  try {
   
    const count = await strapi.db.query("api::nft.nft").count({
      where: {
        try_count: {
          $gte: 1
        },
        collection: {
          publishedAt :{
            $notNull: true
          }
        },
        image_url: "",
        collection: {
          contract_address: "0x41951c1a94d068e1da124f63d5e99ee2a0acdaac"
        }
      }
    })

    
    for (let i = 0; i < count; i++) {
      const nft = await strapi.db.query("api::nft.nft").findOne({
        where: {
          try_count: {
            $gte: 1
          },
          collection: {
            publishedAt :{
              $notNull: true
            }
          },
          image_url: "",
          collection: {
            contract_address: "0x41951c1a94d068e1da124f63d5e99ee2a0acdaac"
          }
        },
        populate: {
          collection: {
            select: ["contract_address"]
          }
        },
      })

      // const nft = nfts[i];
      const collectionContract = new ethers.Contract(
        nft.collection.contract_address,
        ERC721,
        jsonRpcProvider
      );

      try {
        let metadata = await fetchMetadata({
          collectionContract,
          tokenId: nft.token_id,
          timeout: 10 * 1000
        });
        if (!metadata) throw new Error("invalid metadata")
        const owner = await collectionContract.ownerOf(nft.token_id).catch(null);
        if (!owner) throw new Error("invalid owner");
  
        let retry_count = Number(nft.retry_count)
        if (Number.isNaN(retry_count)) retry_count = 1
        const data = {
          ...metadata,
          retry_count: retry_count + 1
        }
  
        if (nft.owner.toLowerCase() !== owner.toLowerCase()) {
          data.owner = owner
        }
  
  
        await strapi.db.query("api::nft.nft").update({
          where: {
            id: nft.id
          },
          data
        })
  
        console.log(`${i} - data`, data);
      } catch (error) {
        strapi.log.error(`nft_retry_metadata error- ${error.message}`);
        continue
      }
      

      
    }

    strapi.log.info("[CRON TASK] - COMPLETE | LISTING CANCEL DETECTOR - Expirtation");
  } catch (error) {
    // const dm = DiscordManager.getInstance()
    // dm.logError({error, identifier: "Cron - nft_retry_metadata"})
    strapi.log.error(`nft_retry_metadata error- ${error.message}`);
  }
};

module.exports = {
  nft_retry_metadata
};
