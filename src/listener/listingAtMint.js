const { ethers } = require("ethers");
const axios = require("axios");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  IPFS
} = require("../utils/constants");
const ERC721 = require("../web3/abis/ERC721.json");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { wait, validInteger } = require("../utils/helpers");
const { LOG_TYPE_MINT } = NFT_LOG_TYPE;



const createNFTAtMint = async ({ log, strapi }) => {
  try {
    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    const transferTo = `0x${log.topics[2].slice(-40)}`;
    let bigIntTokenId = BigInt(log.topics[3]);
    const tokenId = Number(bigIntTokenId)

    const contract_address = log.address;
    const ccm = CollectionCacheManager.getInstance(strapi)
    const existedCollection = ccm.getCollectionByAddress(contract_address)
  if (!existedCollection) return;
  
    console.log(`Start Create NFT at Mint`);
    const dm = DiscordManager.getInstance();
    try {

      // 1.1 check exist nft
      const existNFT = await strapi.db.query("api::nft.nft").findOne({
        populate: {
          collection: true
        },
        where: {
          $and: [
            {
              collection: {
                contract_address
              }
            },
            {
              collection: {
                publishedAt: {
                  $notNull: true
                }
              }
            },
            {
              token_id: tokenId,
            }
          ]


        }
      })

      if (existNFT) {
        // Update NFT
        if (existNFT.owner.toLowerCase() !== transferTo.toLowerCase()) {
          await strapi.db.query("api::nft.nft")
            .update({
              where: {
                $and: [
                  {
                    collection: {
                      contract_address
                    }
                  },
                  {
                    id: existNFT.id
                  }
                ]
              },
              data: {
                owner: transferTo
              }
            })
        }

        return

      }

     



      // 1. fetch metadata
      const collectionContract = new ethers.Contract(
        contract_address,
        ERC721,
        jsonRpcProvider
      );

      // Create NFT
      let metadata = await fetchMetadata({ collectionContract, tokenId });
      if (!metadata) {
        metadata = {
          token_id: tokenId,
          name: `${existedCollection.name} #${tokenId}`,
          image_url: "",
          traits: null,
          is_valid_metadata: false,
          try_count: 1
        }
        console.log(`${metadata.name} NFT at Mint (invalid metadata)`);
      }

      const createdNFT = await strapi.db.query("api::nft.nft")
        .create({
          data: {
            collection: existedCollection.id,
            ...metadata,
            owner: transferTo
          }
        })

      dm.logNFTMinting({ contract_address, createdNFT }).catch();

      strapi.db.query("api::nft-trade-log.nft-trade-log")
        .create({
          data: {
            type: LOG_TYPE_MINT,
            from: transferFrom,
            to: transferTo,
            nft: createdNFT.id,
            tx_hash: log.transactionHash,
            timestamp: dayjs().unix()
          }
        }).catch()



      // publish
      if (
        !existedCollection.publishedAt
      ) {
        const updatedCollection = await strapi.db.query("api::collection.collection")
          .update({
            where: {
              id: existedCollection.id,
            },
            data: {
              publishedAt: new Date(),
              logo_url: createdNFT?.image_url || ""
            }
          })


        dm.logListingCollectionPublish(updatedCollection).catch((err) =>
          console.error(err.message)
        );
      }


      // Update total supply
      // try {
      //   const _total_supply = await collectionContract
      //     .totalSupply()
      //   const total_supply = _total_supply.toNumber();
      //   if (
      //     !Number.isNaN(total_supply) &&
      //     total_supply > 0 &&
      //     existedCollection.total_supply !== total_supply
      //   ) {
      //     return strapi.db.query("api::collection.collection")
      //       .update({
      //         where: {
      //           id: existedCollection.id,
      //         },
      //         data: {
      //           total_supply
      //         }
      //       })
      //   }
      // } catch (error) {
      //   console.error(`${existedCollection.name} don't have totalSupply() - ${error.message}`)
      // }

    } catch (error) {
      console.error(`Create NFT Error - ${error.message}`);
      dm.logListingNFTError({
        collection: existedCollection,
        error,
        tokenId
      }).catch((err) => console.error(err.message));
    }
  } catch (error) {
    console.log(`createNFTAtMint error - ${error.message}`);
  }
};

const fetchMetadata = async ({ collectionContract, tokenId, timeout = 3 * 1000 }) => {
  try {
    let tokenURI = await collectionContract.tokenURI(tokenId);
    if (tokenURI.startsWith("ipfs://"))
      tokenURI = tokenURI.replace("ipfs://", IPFS.GATEWAY_URL);

    let metadata = await axios.get(tokenURI, {
      timeout
    }).then((res) => res.data);
    if (Buffer.isBuffer(metadata)) {
      // Read Buffer Data
      const dataString = metadata.toString("utf-8");
      const jsonData = JSON.parse(dataString);
      metadata = jsonData;
    }

    let image_url = metadata?.image || "";
    if (image_url.startsWith("ipfs://"))
      image_url = image_url.replace("ipfs://", IPFS.GATEWAY_URL);
    const attributes =
      Array.isArray(metadata?.attributes) && metadata?.attributes.length > 0
        ? metadata.attributes
        : null;

    return {
      name: metadata.name,
      image_url,
      token_id: tokenId,
      traits: attributes,
      try_count: null
    };
  } catch (error) {
    console.log(`fetchMetadata error - ${error.message}`);
    return null;
  }
};

module.exports = {
  createNFTAtMint,
  fetchMetadata
};
