const { jsonRpcProvider, jsonRpcProvider_cron, DISCORD_INFO } = require("./constants");
const { ethers } = require("ethers");
const IERC721 = require("../api/sdk/controllers/IERC721");
const { getISOString } = require("./helpers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");

const getNFTsAndUpdateOwnerOfNFTs = async ({ strapi, isGT = true }) => {
  const seconds_1h = 60 * 60
  const seconds_1d = seconds_1h * 24
  const unit = 10

  let totalUpdatedCount = 0
  for (let i = 0; i < 150000 / unit; i++) {
    console.log(`${i} start`);
    const start = i * unit
    const end = unit * (i + 1)
    const $and = [
      {
        collection: {
          publishedAt: {
            $notNull: true
          }
        },
      },
      //   {
      //       collection: {
      //           airdrop_multiplier: {
      //               $gt: 1
      //           }
      //       }
      //   },
      //   {
      //     collection: {
      //         airdrop_multiplier: {
      //             $lte: 1
      //         }
      //     }
      // },
      // {
      //     collection: {
      //         slug: "plutocats"
      //     }
      // }
    ]

    $and.push(isGT ?
      {
        collection: {
          airdrop_multiplier: {
            $gt: 1
          }
        }
      } :
      {
        collection: {
          airdrop_multiplier: {
            $lte: 1
          }
        }
      }
    )

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
        $and
      },
      // orderBy: {
      //   collection: {
      //     airdrop_multiplier: "DESC"
      //   }
      // },
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

  console.log(333, "totalUpdatedCount", totalUpdatedCount);
}


const updateOwnerOfNFTs = async ({ strapi, nfts }) => {
  const dm = DiscordManager.getInstance(strapi)
  const willUpdateOwnerPromises = nfts.map((nft) => {
    const collectionContract = new ethers.Contract(
      nft.collection.contract_address,
      IERC721.abi,
      jsonRpcProvider_cron
    );
    return collectionContract
      .ownerOf(nft.token_id)
      .then((realOwner) => {
        try {
          if (realOwner.toLowerCase() !== nft.owner.toLowerCase()) {
            dm.logError({ error: new Error(`name:${nft.name} | token id: ${nft.token_id} | prev:${nft.owner} | real:${realOwner}`), identifier: `updateOwnerOfNFTs`, channelId: DISCORD_INFO.CHANNEL.ERROR_LOG }).catch()
            if (nft.sell_order) {
              return strapi.entityService
                .delete("api::order.order", nft.sell_order.id)
                .then((_) =>
                  strapi.entityService.update("api::nft.nft", nft.id, {
                    data: {
                      owner: realOwner,
                    },
                  })
                );
            }
            return strapi.entityService.update("api::nft.nft", nft.id, {
              data: {
                owner: realOwner,
              },
            });
          }
          return null;
        } catch (error) {
          console.error(`${nft.id} error - ${error.message}`);
          return null;
        }
      })
      .catch((e) => null);
  });
  let result = await Promise.all(willUpdateOwnerPromises);
  result = result.filter((_) => _ !== null);
  console.log(`${result.length} NFTs are updated to real owner`);
};


module.exports = {
  getNFTsAndUpdateOwnerOfNFTs,
  updateOwnerOfNFTs,
};
