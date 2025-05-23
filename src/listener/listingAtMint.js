const { ethers } = require("ethers");
const axios = require("axios");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  IPFS,
  jsonRpcProvider_cron,
  PREPROCESS_TYPE
} = require("../utils/constants");
const ERC721 = require("../web3/abis/ERC721.json");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { getContractMetadata, createCollection } = require("./collectionDeployerERC721And1155Listener");
const BlacklistCacheManager = require("../cache-managers/BlacklistCacheManager");
const { LOG_TYPE_MINT } = NFT_LOG_TYPE;



const createNFTAtMint = async ({ log, strapi }) => {
  try {
    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    const transferTo = `0x${log.topics[2].slice(-40)}`;
    let bigIntTokenId = BigInt(log.topics[3]);
    const tokenId = bigIntTokenId.toString()

    const contract_address = log.address;
    const ccm = CollectionCacheManager.getInstance(strapi)
    let existedCollection = ccm.getCollectionByAddress(contract_address)
    if (!existedCollection) {
      existedCollection = await strapi.db.query("api::collection.collection").findOne({
        where: {
          contract_address
        }
      })

      if (!existedCollection) {
        // TODO: check metadata and create collection
        try {
          existedCollection = await checkAndCreateCollection({ strapi, contract_address })

        } catch (error) {
          return
        }
      } else {
        await ccm.fetchAndUpdateCollections({ strapi })
      }
      return
    }
    strapi.log.info(`createNFTAtMint - Start Create NFT at Mint`);
    const dm = DiscordManager.getInstance();
    try {
      // 1.1 check exist nft
      const existNFT = await strapi.db.query("api::nft.nft").findOne({
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

      /**
       * Listing Process
       * 1. preprocess 에 type MINT 로 create
       * 2. owner 만 조회해서 db 추가 (collection logo 가 없고 token_id 가 0 또는 1인 경우 fetching 한번 함.)
       * 
       * --
       * Metadata Fetching Queue 
       * 1. metadata 확인해서 넣어주기
       * 2. 성공시 삭제, 실패시 try_count 업데이트
       */



      // 1. fetch metadata
      const collectionContract = new ethers.Contract(
        contract_address,
        ERC721,
        jsonRpcProvider
      );

      // Create NFT

      let metadata = {
        token_id: tokenId,
        name: `${existedCollection.name} #${tokenId}`,
        image_url: "",
        traits: null,
        token_uri: null
      }
      if (contract_address.toLowerCase() === "0x1195cf65f83b3a5768f3c496d3a05ad6412c64b7".toLowerCase()) { // Layer3 CUBE
        metadata.image_url = "https://wen-ex.myfilebase.com/ipfs/QmX86kXhup5WpYb5wy1v6gUB9wYLbaEvCHHhwyVuzFsxiy"
      }


      const bcm = BlacklistCacheManager.getInstance(strapi)
      const blacklist = bcm.getBlacklistAddresses()
      const isIncludesInBlacklist = blacklist.map(b => b.toLowerCase()).includes(existedCollection.contract_address.toLowerCase())
      if (!isIncludesInBlacklist) {
        const createdNFT = await strapi.db.query("api::nft.nft")
          .create({
            data: {
              collection: existedCollection.id,
              ...metadata,
              owner: transferTo
            }
          })

        await strapi.db.query("api::preprocess.preprocess")
          .create({
            data: {
              type: PREPROCESS_TYPE.MINT,
              nft: createdNFT.id,
              collection: existedCollection.id,
              try_count: 1,
              timestamp: dayjs().unix()
            }
          })
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

        dm.logNFTMinting({ contract_address, createdNFT }).catch();

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
              }
            })


          dm.logListingCollectionPublish(updatedCollection).catch((err) =>
            console.error(err.message)
          );
        }


      }








      strapi.log.info(`createNFTAtMint - complete`)

      // TODO: try_count 에 따라 name , total supply 업데이트 시켜주기

    } catch (error) {
      strapi.log.error(`Create NFT Error - ${error.message}`);
      dm.logListingNFTError({
        collection: existedCollection,
        error,
        tokenId
      }).catch();
    }
  } catch (error) {
    strapi.log.error(`createNFTAtMint error - ${error.message}`);
  }
};

const fetchMetadata = async ({ collectionContract, tokenId, timeout = 3 * 1000 }) => {
  try {
    let tokenURI = await collectionContract.tokenURI(tokenId);
    const requestURI = tokenURI.startsWith("ipfs://") ? tokenURI.replace("ipfs://", IPFS.GATEWAY_URL) : tokenURI

    let metadata = await axios.get(requestURI, {
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
      token_uri: tokenURI
    };
  } catch (error) {
    console.log(`fetchMetadata error - ${error.message}`);
    return null;
  }
};

const checkAndCreateCollection = async ({ strapi, contract_address }) => {
  try {
    let metadataInfo = await getContractMetadata(contract_address);
    if (typeof metadataInfo === "boolean") throw new Error("invalid metadata");
    if (!metadataInfo.isERC721) throw new Error("invalid metadata");
    const name = metadataInfo.name;
    const total_supply = metadataInfo.total_supply;
    const token_type = metadataInfo.isERC721 ? "ERC721" : "ERC1155";
    const contract = new ethers.Contract(contract_address, ERC721, jsonRpcProvider_cron);
    const creator_address = await contract.owner()
    const collection = await createCollection({
      strapi,
      contract_address,
      creator_address,
      name,
      token_type,
      total_supply
    });
    return collection
  } catch (error) {
    strapi.log.error(`createNFTAtMint | createCollection - ${error.message}`)
    throw new Error(error)
  }
}


module.exports = {
  createNFTAtMint,
  fetchMetadata
};
