const  {ethers}  = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE,
  CONTRACT_ADDRESSES
} = require("../utils/constants");
const { updateFloorPrice, updateOrdersCount, updateOwnerCount } = require("./collectionStats");
const { updateOwner } = require("./blockchainListener");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager")
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


const transferListener = async ({log, strapi}) => {
  try {
    const ccm = CollectionCacheManager.getInstance(strapi);
    const myCollections = ccm.getCollectionAddresses();
    if (!myCollections.includes(log.address.toLowerCase())) return;

    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    const transferTo = `0x${log.topics[2].slice(-40)}`;
    const tokenId = BigInt(log.topics[3])

          
    // Mint 제외
    if (transferFrom === "0x0000000000000000000000000000000000000000") return  

     // Buy Event 제외
    const txReceipt = await jsonRpcProvider.getTransaction(
      log.transactionHash
    );
    const receipt = await txReceipt.wait()
    const receiptLogs = receipt.logs
    if (!Array.isArray(receiptLogs)) return 
    const receiptTopics = receiptLogs.map(log => {
      if (Array.isArray(log.topics) && log.topics.length > 0) return log.topics[0]
      return ""
    })
    const  isIncludeBuyEventType = checkReceiptTopicsForEventTypes(receiptTopics)
    if (isIncludeBuyEventType) return 
    const exchangeAddresses = Object.keys(CONTRACT_ADDRESSES).map(key => CONTRACT_ADDRESSES[key].toLowerCase())
    const isIncludeWenOrElExchange = exchangeAddresses.includes(txReceipt.to.toLowerCase())
    
    if (isIncludeWenOrElExchange && isIncludeBuyEventType) return 

    // 1. Get NFT
    const nftData = await strapi.db.query("api::nft.nft").findOne({
      where: {
        token_id: tokenId.toString(),
        collection: { contract_address: log.address },
      },
      populate: {
        sell_order: true,
      },
    });

    // 1-1. If nft doesn't exist, return
    if (!nftData) {
      console.log("There is no NFT DATA.");
      return;
    }

    /** Common Tasks */
    await updateOwner({strapi,nftData,transferTo })
    await updateOwnerCount({ strapi }, log.address);

    strapi.entityService.create(
      "api::nft-trade-log.nft-trade-log",
      {
        data: {
          type: LOG_TYPE_TRANSFER,
          from: transferFrom,
          to: transferTo,
          nft: nftData.id,
          tx_hash: log.transactionHash,
          timestamp: dayjs().unix(),
        },
      }
    ).catch()

    // 리스팅 되있는 상황에서 transfer
    if (nftData.sell_order) {
      strapi.entityService.delete(
        "api::order.order",
        nftData.sell_order.id,
        {
          populate: { nft: true },
        }
      ).then(deletedOrder => {
        return strapi.entityService.create(
          "api::nft-trade-log.nft-trade-log",
          {
            data: {
              ex_type: EX_TYPE.WEN,
              type: LOG_TYPE_AUTO_CANCEL_LISTING,
              from: transferFrom,
              nft: nftData.id,
              tx_hash: log.transactionHash,
              timestamp: dayjs().unix(),
            },
          }
        );
      }).catch()
    }
     
  } catch (error) {
    console.log("error", error.message);
  }


}

const checkReceiptTopicsForEventTypes = ( receiptTopics) => {
  // Loop through each topic in receiptTopics
  const eventTypeHashList = Object.keys(EVENT_TYPE).map(key => EVENT_TYPE[key])
  for (let i = 0; i < receiptTopics.length; i++) {
    const topic = receiptTopics[i];
    // Check if the current topic is in the eventTypeHashList
    if (eventTypeHashList.includes(topic)) {
      return true; // Return true immediately if a match is found
    }
  }
  return false; // Return false if no matches are found after checking all topics
};


module.exports = { transferListener };
