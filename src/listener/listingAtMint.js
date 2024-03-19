const { ethers } = require("../../node_modules/ethers/lib/index");
const {
    jsonRpcProvider,
    NFT_LOG_TYPE,
    WEN_EX_CONTRACT_ADDRESS,
  } = require("../utils/constants");
  const ABI = []

const createNFTAtMint = async ({strapi, log}) => {
   
    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    const transferTo = `0x${log.topics[2].slice(-40)}`;
    const tokenId = BigInt(log.topics[3])
    if (transferFrom !== "0x0000000000000000000000000000000000000000") return
    const contract_address = log.address

    const existedCollection = await strapi.db.query('api::collection.collection').findOne({
        where: { contract_address },
      });

    if (!existedCollection)    return 

    // 1. fetch metadata 
    // 2. fetch image cache
    // 3. create NFT
    
    await strapi.entityService.create("api::nft.nft", {
        data: {
            collection: existedCollection.id
          contract_address, creator_address, name, type, description: "This collection has no description yet. Contact the owner of this collection about setting it up on Element!",
          protocol_fee_receiver: PROTOCOL_FEE.RECEIVER,
          protocol_fee_point: PROTOCOL_FEE.POINT,
          total_supply
    
        }
      })
    

    
    
}



module.exports = {
    createNFTAtMint
}