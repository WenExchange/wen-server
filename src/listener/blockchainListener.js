const {ethers} = require("ethers");
const ExchangeContractABI = require("../web3/abis/ExchangeContractABI.json")

//TODO: change it to mainnet
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  CONTRACT_ADDRESSES,
  EVENT_TYPE,
  EX_TYPE
} = require("../utils/constants");
const { elementContractListener } = require("./elementContractListener");
const { wenContractListener } = require("./wenContractListener");
const { transferListener } = require("./transferListener");

async function createTransferListener({ strapi }) {
  console.log("[TRANSFER EVENT LISTENING ON]");
  
  await jsonRpcProvider.removeAllListeners();
  let filter = {
    topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };
  jsonRpcProvider.on(filter, async (log, _) => {
    transferListener({log, strapi}).catch(e => console.error(444,e.message))
  });

  /** Element Listener */
  const elementContract = new ethers.Contract(
    CONTRACT_ADDRESSES.EL_EX,
    ExchangeContractABI.abi,
    jsonRpcProvider
  );
  elementContract.on("*", async event => {
    elementContractListener({event, strapi}).catch(e => console.error(e.message))
  });


  /** Wen Contract Listener */
  const wenContract = new ethers.Contract(
    CONTRACT_ADDRESSES.WEN_EX,
    ExchangeContractABI.abi,
    jsonRpcProvider
  );
  wenContract.on("*", async event => {
    wenContractListener({event,strapi}).catch(e => console.error(e.message))
  });


  
}







module.exports = { createTransferListener };
