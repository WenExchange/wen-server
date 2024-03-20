const ethers = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager")
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  WEN_EX_CONTRACT_ADDRESS,
  PROTOCOL_FEE
} = require("../utils/constants");

const getContractMetadata = async (address) => {
  const abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  ];
  const contract = new ethers.Contract(address, abi, jsonRpcProvider);
  try {
      const isERC721 = await contract.supportsInterface('0x80ac58cd')
      const isERC1155 = await contract.supportsInterface('0xd9b67a26')
      const total_supply = await contract.totalSupply().catch(err => 0)
    
      const name = await contract.name()
      return {isERC721,isERC1155, name, total_supply}
  } catch (error) {
      return false;
  }
};

const createCollection = async ({strapi, contract_address, creator_address, name, token_type, total_supply }) => {
  console.log(`Checked Collection Contract Deploy`);
  const dm = DiscordManager.getInstance()
  try {
    const existedCollection = await strapi.db.query('api::collection.collection').findOne({
      where: { contract_address }
    });
    if (existedCollection) {
      console.log("Already exist collection contract");
      return
    }
    const createdCollection = await strapi.entityService.create("api::collection.collection", {
      data: {
        contract_address, creator_address, name, token_type, description: "This collection has no description yet. Contact the owner of this collection about setting it up on Element!",
        protocol_fee_receiver: PROTOCOL_FEE.RECEIVER,
        protocol_fee_point: PROTOCOL_FEE.POINT,
        total_supply
  
      }
    })
    dm.logListingCollection(createdCollection).catch(err => console.error(err.message))
  } catch (error) {
    dm.logListingCollectionError(error).catch(err => console.error(err.message))
  }
  

  
}


const collectionDeployerERC721And1155Listener =  async ({blockNumber, strapi}) => {
  // // exit early if it's not our NFT
  try {
    const block = await jsonRpcProvider.getBlockWithTransactions(blockNumber);
    for (const tx of block.transactions) {
        if (tx.to === null) {
   
            const receipt = await jsonRpcProvider.getTransactionReceipt(tx.hash);
            const contract_address = receipt.contractAddress;
            const metadataInfo = await getContractMetadata(contract_address);
            if (typeof metadataInfo === "boolean") return 
            if (!metadataInfo.isERC721 &&  !metadataInfo.isERC1155) return
   
            const creator_address = tx.from
            const name = metadataInfo.name
            const total_supply = metadataInfo.total_supply
            const token_type = metadataInfo.isERC721 ? "ERC721" : "ERC1155"
            await createCollection({strapi, contract_address, creator_address, name, token_type, total_supply})
        }
    }


  } catch (error) {
    console.log("collectionDeployerERC721And1155Listener error", error.message);
  }
}
module.exports = { collectionDeployerERC721And1155Listener };
