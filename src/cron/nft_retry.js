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


const nft_retry_metadata = async ({ strapi, contract_address }) => {
  strapi.log.info("[CRON TASK] - START | NFT RETRY - Metadata");
  let count = 0
  try {
    count = await strapi.db.query("api::nft.nft").count({
      where: {
        $and: [
          {
            try_count: {
              $gte: 1
            },
          },
          {
            try_count: {
              $lte: 3
            },
          },
          {
            collection: {
              publishedAt: {
                $notNull: true
              }
            },
          },
          { image_url: "" },
          {
            collection: {
              contract_address
            }
          }
        ]

      }
    })



  } catch (error) {
    strapi.log.error(`nft_retry_metadata error- ${error.message}`);
  }

  try {
    console.log(`nft_retry_metadata will update count ${count}`);

    for (let i = 0; i < count; i++) {
      // const nft = nfts[i];
      const nft = await strapi.db.query("api::nft.nft").findOne({
        where: {
          $and: [
            {
              try_count: {
                $gte: 1
              },
            },
            {
              try_count: {
                $lte: 3
              },
            },
            {
              collection: {
                publishedAt: {
                  $notNull: true
                }
              },
            },
            { image_url: "" },
            {
              collection: {
                contract_address
              }
            }
          ]
  
        },
        populate: {
          collection: {
            select: ["contract_address"]
          }
        },
      })


      const collectionContract = new ethers.Contract(
        nft.collection.contract_address,
        ERC721,
        jsonRpcProvider
      );

      try {
        let metadata = await fetchMetadata({
          collectionContract,
          tokenId: nft.token_id,
          timeout: 20 * 1000
        });
        if (!metadata) throw new Error("invalid metadata")
        const owner = await collectionContract.ownerOf(nft.token_id).catch(null);
        if (!owner) throw new Error("invalid owner");

        let try_count = Number(nft.try_count)
        if (Number.isNaN(try_count)) try_count = 1
        const data = {
          ...metadata,
          try_count: try_count + 1
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
        strapi.log.error(`nft_retry_metadata error- ${nft.id} ${nft.name} ${error.message}`);
        let try_count = Number(nft.try_count)
        if (Number.isNaN(try_count)) try_count = 1
        try {
          await strapi.db.query("api::nft.nft").update({
            where: {
              id: nft.id
            },
            data: {
              try_count: try_count + 1
            }
          })
        } catch (error) {
          console.error(error.message)
        }


        continue
      }



    }

    strapi.log.info("[CRON TASK] - COMPLETE | LISTING CANCEL DETECTOR - Expirtation");
  } catch (error) {
    // const dm = DiscordManager.getInstance()
    // dm.logError({error, identifier: "Cron - nft_retry_metadata"})
    strapi.log.error(`nft_retry_metadata error- ${nft.id} ${nft.name} ${error.message}`);



  }
};

module.exports = {
  nft_retry_metadata
};
