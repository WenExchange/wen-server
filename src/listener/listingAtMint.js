const { ethers } = require("../../node_modules/ethers/lib/index");
const axios = require("axios")
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager")
const {
    jsonRpcProvider,
    NFT_LOG_TYPE,
    WEN_EX_CONTRACT_ADDRESS,
    IPFS,
  } = require("../utils/constants");
  const ERC721 = require("../web3/abis/ERC721.json")
  const {
    LOG_TYPE_SALE,
    LOG_TYPE_TRANSFER,
    LOG_TYPE_LISTING,
    LOG_TYPE_OFFER,
    LOG_TYPE_COLLECTION_OFFER,
    LOG_TYPE_CANCEL_LISTING,
    LOG_TYPE_AUTO_CANCEL_LISTING,
    LOG_TYPE_CANCEL_OFFER,
    LOG_TYPE_MINT,
  } = NFT_LOG_TYPE;


const createNFTAtMint = async ({strapi, log}) => {
    try {
        const transferFrom = `0x${log.topics[1].slice(-40)}`;
        const transferTo = `0x${log.topics[2].slice(-40)}`;
        const tokenId = BigInt(log.topics[3])
        if (transferFrom !== "0x0000000000000000000000000000000000000000") return
        const contract_address = log.address
    
        const existedCollection = await strapi.db.query('api::collection.collection').findOne({
            where: { contract_address },
          });
    
        if (!existedCollection)  return 
        console.log(`Start Create NFT at Mint`);
        const dm = DiscordManager.getInstance()
        try {
            // 1. fetch metadata
        const collectionContract =  new ethers.Contract(contract_address, ERC721, jsonRpcProvider);
        const metadata = await fetchMetadata({collectionContract, tokenId})
        console.log(`${metadata.name} NFT at Mint`);
        // 2. create NFT
   

        const createdNFT = await strapi.entityService.create("api::nft.nft", {
            data: {
                collection: existedCollection.id,
                ...metadata
        
            }
          }).then(nftData => {
              return strapi.entityService.create(
                "api::nft-trade-log.nft-trade-log",
                {
                  data: {
                    type: LOG_TYPE_MINT,
                    from: transferFrom,
                    to: transferTo,
                    nft: nftData.id,
                    tx_hash: log.transactionHash,
                    timestamp: dayjs().unix(),
                  },
                }
              );
          })

       
          dm.logListingNFT({collection:existedCollection, createdNFT })

          // publish
          if (!existedCollection.publishedAt && existedCollection.type === "ERC721") {
            const updatedCollection = await strapi.entityService.update("api::collection.collection", existedCollection.id,{
                data: {
                    publishedAt: new Date()
            
                }
              })
              dm.logListingCollectionPublish(updatedCollection)
          }
        } catch (error) {
            dm.logListingNFTError({existedCollection, error,tokenId })
        }
        
    } catch (error) {
        
    }
}

const fetchMetadata = async ({collectionContract,tokenId }) => {
    let tokenURI = await collectionContract.tokenURI(tokenId);
    if (tokenURI.startsWith('ipfs://')) 
      tokenURI = tokenURI.replace('ipfs://', IPFS.GATEWAY_URL);
      const owner = await collectionContract.ownerOf(tokenId)
      const metadata = await axios.get(tokenURI).then(res => res.data);

      let image_url = metadata?.image || "";
  const attributes = Array.isArray(metadata?.attributes) && metadata?.attributes.length > 0 ? metadata.attributes : null;
  
  return {
    name: metadata.name,
    image_url,
    token_id: tokenId,
    traits: attributes,
    owner
  };

}




module.exports = {
    createNFTAtMint
}