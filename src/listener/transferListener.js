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
} = require("../utils/constants");

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

const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");

async function listenTransfer({ strapi }) {
  console.log("it's on");
  let filter = {
    topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };
  let cancelFilter = {
    topics: [ethers.utils.id("ERC721OrderCancelled(address,uint256)")],
  };

  await jsonRpcProvider.removeAllListeners();
  jsonRpcProvider.on(filter, async (log, _) => {
    // // exit early if it's not our NFT
    try {
    //   const ccm = CollectionCacheManager.getInstance(strapi);
    //   const myCollections = ccm.getCollectionAddresses();
    //   if (!myCollections.includes(log.address.toLowerCase())) return;
  
    console.log(333, log.topics.length)
    if (log.topics.length <= 3) {
        // console.log(333, "topics length < 3")
        return
    }
      const transferFrom = `0x${log.topics[1].slice(-40)}`;
      const transferTo = `0x${log.topics[2].slice(-40)}`;
      const tokenId = BigInt(log.topics[3]);

      const txReceipt = await jsonRpcProvider.getTransaction(
        log.transactionHash
      );


      if (transferFrom === "0x0000000000000000000000000000000000000000") {
        console.log(`colleciton:${log.address} Mint - ${transferFrom} -> ${transferTo} with token id:${tokenId}`);
      } else {
        console.log(`colleciton:${log.address} transfer with value - ${transferFrom} -> ${transferTo} with token id:${tokenId} with value: ${ethers.utils.formatEther(txReceipt.value)} || txHash ${log.transactionHash}`);
        console.log(txReceipt);
      }
      
      
      
   
      // 1. NFT 의 sell order가 존재함?
      // 1-1. YES. NFT Owner 가 transferFrom 임?

      //

      return 


    } catch (error) {
      console.log("error", error);
    }
  });
}

listenTransfer({strapi : null})
module.exports = { listenTransfer };
