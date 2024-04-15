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
    
    if (transferFrom !== "0x0000000000000000000000000000000000000000") return;
    const isValidTokenId = validInteger(bigIntTokenId)
    if (!isValidTokenId) {
      throw new Error(`Token id is overflow - ${bigIntTokenId.toString()}`)
    }
    const tokenId = Number(bigIntTokenId)

    const contract_address = log.address;

    const ccm = CollectionCacheManager.getInstance(strapi);

    const collection = ccm.getCollectionByAddress(contract_address);

    const existedCollection = await strapi.db.query("api::collection.collection")
      .findOne({
        where: {
          id: collection.id
        }
      })
      .catch((e) => null);

    if (!existedCollection) return;
    console.log(`Start Create NFT at Mint`);
    const dm = DiscordManager.getInstance();
    try {
      // 1. fetch metadata
      const collectionContract = new ethers.Contract(
        contract_address,
        ERC721,
        jsonRpcProvider
      );

   
      // const owner = await collectionContract.ownerOf(tokenId).catch(err => null);
      // if (!owner) throw new Error(`Invalid Owner`)
      let metadata = await fetchMetadata({ collectionContract, tokenId });
      if (!metadata) {
        metadata = {
          token_id: tokenId,
          name: `${existedCollection.name} #${tokenId}`,
          image_url: "",
          traits: null
        }
        console.log(`${metadata.name} NFT at Mint (invalid metadata)`);
      } else {
        console.log(`${metadata.name} NFT at Mint (valid metadata)`);
      }
     

      // 1.1 check exist nft
      const existNFT = await strapi.db.query("api::nft.nft").findOne({
        populate: {
          collection: true
        },
        where: {
          $and: [
            {
              collection: existedCollection.id,
            },
            {
              token_id: metadata.token_id,
            }
          ]
          
       
        }
      })
      if (existNFT) {
        dm.logListingNFTError({ collection: existedCollection, tokenId:existNFT.token_id, error: new Error(`${existNFT.name} NFT already exist`)  }).catch(
          (err) => console.error(err.message)
        );
        return 
      }
      // 2. create NFT
      const createdNFT = await strapi.db.query("api::nft.nft")
      .create({
        data: {
          collection: existedCollection.id,
          ...metadata,
          owner: transferTo
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


      try {
        await collectionContract
          .totalSupply()
          .then((_total_supply) => {
            const total_supply = _total_supply.toNumber();
            if (
              !Number.isNaN(total_supply) &&
              total_supply > 0 &&
              existedCollection.total_supply !== total_supply
            ) {
              return strapi.db.query("api::collection.collection")
              .update({
                where: {
                  id: existedCollection.id,
                },
                data: {
                  total_supply
                }
              })
            }
          })
          .catch();
      } catch (error) {
        console.error(`${existedCollection.name} don't have totalSupply() - ${error.message}`)
      }

      


      dm.logListingNFT({ collection: existedCollection, createdNFT }).catch(
        (err) => console.error(err.message)
      );

      // publish
      if (
        !existedCollection.publishedAt &&
        existedCollection.token_type === "ERC721"
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

const fetchMetadata = async ({ collectionContract, tokenId }) => {
  try {
    let tokenURI = await collectionContract.tokenURI(tokenId);
    if (tokenURI.startsWith("ipfs://"))
      tokenURI = tokenURI.replace("ipfs://", IPFS.GATEWAY_URL);

    let metadata = await axios.get(tokenURI).then((res) => res.data);
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
