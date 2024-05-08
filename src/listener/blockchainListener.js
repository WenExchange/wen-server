const {ethers} = require("ethers");
const ExchangeContractABI = require("../web3/abis/ExchangeContractABI.json")
const SeportABI = require("../web3/abis/Seaport.json");
const { transferListener } = require("./transferListener");
const ElementContractQueueManager = require("../queue-manager/ElementContractQueueManager");
const WenContractQueueManager = require("../queue-manager/WenContractQueueManager");
const ExchangeContractQueueManager = require("../queue-manager/ExchangeContractQueueManager");
const wenETHContractQueueManager = require("../queue-manager/wenETHContractQueueManager")
//TODO: change it to mainnet
const {
  jsonRpcProvider,
  jsonRpcProvider_cron,
  NFT_LOG_TYPE,
  CONTRACT_ADDRESSES,
  EVENT_TYPE,
  EX_TYPE,
  WEN_ETH_ADDRESS
} = require("../utils/constants");

const { collectionDeployerERC721And1155Listener } = require("./collectionDeployerERC721And1155Listener");


async function createTransferListener({ strapi }) {
  console.log("[TRANSFER EVENT LISTENING ON]");
  
  jsonRpcProvider.removeAllListeners();
  /** Transfer */
  let filter = {
    topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };

  jsonRpcProvider.on(filter, async (log, _) => {
    await transferListener({log, strapi})
  });

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

  // /** Element Listener */
  const elementContract = new ethers.Contract(
    CONTRACT_ADDRESSES.EL_EX,
    ExchangeContractABI.abi,
    jsonRpcProvider
  );
  const ecqm = ElementContractQueueManager.getInstance(strapi)
  elementContract.on("*", async event => {
    ecqm.addQueue(event)
  });


  // /** Wen Contract Listener */
  const wenContract = new ethers.Contract(
    CONTRACT_ADDRESSES.WEN_EX,
    ExchangeContractABI.abi,
    jsonRpcProvider
  );
  const wcqm = WenContractQueueManager.getInstance(strapi)
  wenContract.on("*", async event => {
    wcqm.addQueue(event)
  });

  /** Collection Deploy Listener */
  jsonRpcProvider_cron.on("block", async blockNumber => {
    try {
      await collectionDeployerERC721And1155Listener({strapi, blockNumber})
    } catch (error) {
      console.error(`collectionDeployerERC721And1155Listener errir - ${error}`)
    }
    
  });
  

  /** wenETH Contract Listener */
  const wenETHContract = new ethers.Contract(
    WEN_ETH_ADDRESS,
    wenETH.abi,
    jsonRpcProvider_cron
  );

  const wecqm = wenETHContractQueueManager.getInstance(strapi);
  wenETHContract.on("*", async (event) => {
    wecqm.addQueue(event);
  });
  
  


  
}







module.exports = { createTransferListener };
