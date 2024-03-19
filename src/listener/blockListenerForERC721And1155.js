const ethers = require("ethers");
const { Web3 } = require("web3");
const dayjs = require("dayjs");
const web3 = new Web3();
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");

//TODO: change it to mainnet
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

const createCollection = async ({strapi, contract_address, creator_address, name, type, total_supply }) => {
  const existedCollection = await strapi.db.query('api::collection.collection').findOne({
    where: { contract_address }
  });
  if (existedCollection) {
    console.log("Already exist collection contract");
    return
  }
  await strapi.entityService.create("api::collection.collection", {
    data: {
      contract_address, creator_address, name, type, description: "This collection has no description yet. Contact the owner of this collection about setting it up on Element!",
      protocol_fee_receiver: PROTOCOL_FEE.RECEIVER,
      protocol_fee_point: PROTOCOL_FEE.POINT,
      total_supply

    }
  })
}


async function blockListenerForERC721And1155({ strapi }) {

  await jsonRpcProvider.removeAllListeners();
  jsonRpcProvider.on("block", async (blockNumber) => {
    // // exit early if it's not our NFT
    try {
      console.log(`Checking block ${blockNumber} for ERC721 deployments...`);
      const block = await jsonRpcProvider.getBlockWithTransactions(blockNumber);
      for (const tx of block.transactions) {
          if (tx.to === null) {
            console.log(`Checking Deplaying`);
              const receipt = await jsonRpcProvider.getTransactionReceipt(tx.hash);
              const contract_address = receipt.contractAddress;
              const metadataInfo = await getContractMetadata(contract_address);
              if (typeof metadataInfo === "boolean") return 
              if (!metadataInfo.isERC721 &&  !metadataInfo.isERC1155) return
              const creator_address = tx.from
              const name = metadataInfo.name
              const total_supply = metadataInfo.total_supply
              const type = metadataInfo.isERC721 ? "ERC721" : "ERC1155"

              console.log(`${type} Contract Deployed! Name: ${name}, Deployer: ${creator_address}, Contract Address: ${contract_address}`);
              // await createCollection({strapi, contract_address, creator_address, name, type, total_supply})
          }
      }


    } catch (error) {
      console.log("error", error);
    }
  });
}


blockListenerForERC721And1155({strapi : null})
module.exports = { blockListenerForERC721And1155 };
