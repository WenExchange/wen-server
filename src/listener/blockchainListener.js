const {ethers} = require("ethers");
const ExchangeContractABI = require("../web3/abis/ExchangeContractABI.json")
const SeportABI = require("../web3/abis/Seaport.json");
const TokenTransferQueueManager = require("../queue-manager/TokenTransferQueueManager")
const MintifyContractQueueManager = require("../queue-manager/MintifyContractQueueManager")
const ElementContractQueueManager = require("../queue-manager/ElementContractQueueManager");
const WenContractQueueManager = require("../queue-manager/WenContractQueueManager");
const ExchangeContractQueueManager = require("../queue-manager/ExchangeContractQueueManager");

//TODO: change it to mainnet
const {
  jsonRpcProvider,
  jsonRpcProvider_cron,
  NFT_LOG_TYPE,
  CONTRACT_ADDRESSES,
  EVENT_TYPE,
  EX_TYPE
} = require("../utils/constants");
const { transferListener } = require("./transferListener");
const { collectionDeployerERC721And1155Listener } = require("./collectionDeployerERC721And1155Listener");




async function createTransferListener({ strapi }) {
  console.log("[TRANSFER EVENT LISTENING ON]");
  
  // await jsonRpcProvider.removeAllListeners();

  /** Transfer */

  // let filter = {
  //   topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  // };
  // const tqm = TokenTransferQueueManager.getInstance(strapi)
  // jsonRpcProvider.on(filter, async (log, _) => {
  //   try {
  //     await transferListener({log, strapi, tqm})
  //   } catch (error) {
  //     console.error(`transferListener error - ${error}`)
  //   }
    
  // });


  

  /** Mintify , Opensea */
  const excqm = ExchangeContractQueueManager.getInstance(strapi)
  const mintifyContract = new ethers.Contract(
    CONTRACT_ADDRESSES.MIN_EX,
    SeportABI.abi,
    jsonRpcProvider
  );
  mintifyContract.on("*", async event => {
    excqm.addQueue({
      ex_type: EX_TYPE.MINTIFY,
      log: event
    })
  });

  const openseaContract = new ethers.Contract(
    CONTRACT_ADDRESSES.OPENSEA_EX,
    SeportABI.abi,
    jsonRpcProvider
  ); 

  openseaContract.on("*", async event => {
    excqm.addQueue({
      ex_type: EX_TYPE.OPENSEA,
      log: event
    })
  });

  /** Element Listener */
  // const elementContract = new ethers.Contract(
  //   CONTRACT_ADDRESSES.EL_EX,
  //   ExchangeContractABI.abi,
  //   jsonRpcProvider
  // );
  // const ecqm = ElementContractQueueManager.getInstance(strapi)
  // elementContract.on("*", async event => {
  //   ecqm.addQueue(event)
  // });


  /** Wen Contract Listener */
  // const wenContract = new ethers.Contract(
  //   CONTRACT_ADDRESSES.WEN_EX,
  //   ExchangeContractABI.abi,
  //   jsonRpcProvider
  // );
  // const wcqm = WenContractQueueManager.getInstance(strapi)
  // wenContract.on("*", async event => {
  //   wcqm.addQueue(event)
  // });
  
  // jsonRpcProvider_cron.on("block", async blockNumber => {
  //   try {
  //     await collectionDeployerERC721And1155Listener({strapi, blockNumber})
  //   } catch (error) {
  //     console.error(`collectionDeployerERC721And1155Listener errir - ${error}`)
  //   }
    
  // });


  
}







module.exports = { createTransferListener };
