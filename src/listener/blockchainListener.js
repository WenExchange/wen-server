const {ethers} = require("ethers");
const ExchangeContractABI = require("../web3/abis/ExchangeContractABI.json")

//TODO: change it to mainnet
const {
  jsonRpcProvider,
  jsonRpcProvider_cron,
  NFT_LOG_TYPE,
  CONTRACT_ADDRESSES,
  EVENT_TYPE,
  EX_TYPE
} = require("../utils/constants");
const { elementContractListener } = require("./elementContractListener");
const { wenContractListener } = require("./wenContractListener");
const { transferListener } = require("./transferListener");
const { collectionDeployerERC721And1155Listener } = require("./collectionDeployerERC721And1155Listener");

async function createTransferListener({ strapi }) {
  console.log("[TRANSFER EVENT LISTENING ON]");
  
  await jsonRpcProvider.removeAllListeners();
  let filter = {
    topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };
  jsonRpcProvider.on(filter, async (log, _) => {
    try {
      await transferListener({log, strapi})
    } catch (error) {
      console.error(`transferListener error - ${error}`)
    }
    
  });

  /** Element Listener */
  const elementContract = new ethers.Contract(
    CONTRACT_ADDRESSES.EL_EX,
    ExchangeContractABI.abi,
    jsonRpcProvider
  );
  elementContract.on("*", async event => {
    try {
      await elementContractListener({event, strapi})
    } catch (error) {
      console.error(`elementContractListener error - ${error}`)
    }
    
  });


  /** Wen Contract Listener */
  const wenContract = new ethers.Contract(
    CONTRACT_ADDRESSES.WEN_EX,
    ExchangeContractABI.abi,
    jsonRpcProvider
  );
  wenContract.on("*", async event => {
    try {
      await wenContractListener({event,strapi})
    } catch (error) {
      console.error(`wenContractListener error - ${error}`)
    }
  });


  jsonRpcProvider_cron.on("block", async blockNumber => {
    try {
      await collectionDeployerERC721And1155Listener({strapi, blockNumber})
    } catch (error) {
      console.error(`collectionDeployerERC721And1155Listener errir - ${error}`)
    }
    
  });


  
}







module.exports = { createTransferListener };
