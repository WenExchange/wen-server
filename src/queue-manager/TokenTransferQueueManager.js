// const { checkValidationAndConnectWithDB } = require("../listener/transferListener");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const { updateOwnerCount, updateFloorPrice, updateOrdersCount } = require("../listener/collectionStats");
const { jsonRpcProvider, CONTRACT_ADDRESSES,NFT_LOG_TYPE, EVENT_TYPE, DISCORD_INFO, EX_TYPE } = require("../utils/constants");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");

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


let instance = null;
module.exports = class TokenTransferQueueManager {
  LOG_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new TokenTransferQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = (log) => {
    this.LOG_QUEUE.push(log)
    console.log(`[TokenTransferQueueManager] addQueue - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
    this.executeQueue()
  }

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    this.isProcessing = true

    while (this.LOG_QUEUE.length > 0) {
      console.log(`[TokenTransferQueueManager] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const log = this.LOG_QUEUE.shift();
      try {
        await checkValidationAndConnectWithDB({strapi: this.strapi,log })
      } catch (error) {
        console.error(`[TokenTransferQueueManager] checkValidationAndConnectWithDB error - ${error}`);
      }
    }
    this.isProcessing = false;
  }
};

const checkValidationAndConnectWithDB = async ({ strapi, log }) => {
  const transferFrom = `0x${log.topics[1].slice(-40)}`;
  const transferTo = `0x${log.topics[2].slice(-40)}`;
  const bigIntTokenId = BigInt(log.topics[3]);
  const tokenId = bigIntTokenId.toString()

  const ccm = CollectionCacheManager.getInstance(strapi);
  const myCollections = ccm.getCollectionAddresses();
  if (!myCollections.includes(log.address.toLowerCase())) {
    
    return 
  }

  // Buy Event 제외
  // const tx = await jsonRpcProvider.getTransaction(log.transactionHash);
  // const receipt = await tx.wait();
  // const receiptLogs = receipt.logs;
  // if (!Array.isArray(receiptLogs)) throw new Error("Invalid receiptLogs");
  // const receiptTopics = receiptLogs.map((log) => {
  //   if (Array.isArray(log.topics) && log.topics.length > 0)
  //     return log.topics[0];
  //   return "";
  // });
  // const isIncludeBuyEventType = checkReceiptTopicsForEventTypes(receiptTopics);

  // if (isIncludeBuyEventType) {
  //   const exchangeAddresses = Object.keys(CONTRACT_ADDRESSES).map((key) =>
  //     CONTRACT_ADDRESSES[key].toLowerCase()
  //   );
  //   const isIncludeWenOrElExchange = exchangeAddresses.includes(
  //     tx.to.toLowerCase()
  //   );
  //   if (isIncludeWenOrElExchange) {
  //     return;
  //   }
  // }

  // 1. Get NFT


  // 업데이트 직전에
  const nftData = await strapi.db.query("api::nft.nft").findOne({
    populate: {
      sell_order: {
        select: ["id"]
      }
    },
    where: {
      $and: [
        {
          token_id: tokenId,
        },
        {
          collection: {
            contract_address: log.address,
          },
        },
      ],
    },
  });

  // 1-1. nftdata validation
  if (!nftData) return 

  if (nftData.owner.toLowerCase() === transferTo.toLowerCase()) return 
  /** Common Tasks */
  const dm = DiscordManager.getInstance()
  // update NFT
  try {
    
    await strapi.db.query("api::nft.nft").update({
      where: {
        id: nftData.id
      },
      data: {
        owner: transferTo,
      },
    })
    await updateOwnerCount({ strapi }, log.address);
  } catch (error) {
    dm.logError({ error, identifier: `checkValidationAndConnectWithDB | update NFT`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    throw new Error(error)
  }

  // 리스팅 되있는 상황에서 transfer
  if (nftData.sell_order) {
    await deleteSellOrderProcess({ strapi, nftData, log, transferFrom, dm })
  }


  try {
    const existTrasferLog = await strapi.db.query
  ("api::nft-trade-log.nft-trade-log").findOne({
    where: {
      type: LOG_TYPE_TRANSFER,
      from: transferFrom,
      to: transferTo,
      nft: nftData.id,
      tx_hash: log.transactionHash,
    }
  })

  if (!existTrasferLog) {
    await strapi.entityService
    .create("api::nft-trade-log.nft-trade-log", {
      data: {
        type: LOG_TYPE_TRANSFER,
        from: transferFrom,
        to: transferTo,
        nft: nftData.id,
        tx_hash: log.transactionHash,
        timestamp: dayjs().unix(),
      },
    })
  }

    
  } catch (error) {
    dm.logError({ error, identifier: `checkValidationAndConnectWithDB | create nft trade log`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }


  
};

const checkReceiptTopicsForEventTypes = (receiptTopics) => {
  // Loop through each topic in receiptTopics
  const eventTypeHashList = Object.keys(EVENT_TYPE).map((key) =>
    EVENT_TYPE[key].toLowerCase()
  );
  for (let i = 0; i < receiptTopics.length; i++) {
    const topic = receiptTopics[i].toLowerCase();
    // Check if the current topic is in the eventTypeHashList
    if (eventTypeHashList.includes(topic)) {
      return true; // Return true immediately if a match is found
    }
  }
  return false; // Return false if no matches are found after checking all topics
};

const deleteSellOrderProcess = async ({ nftData, transferFrom, log, strapi, dm }) => {
  try {
    const deletedOrder = await strapi.entityService
      .delete("api::order.order", nftData.sell_order.id)
    if (deletedOrder) {
      await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            type: LOG_TYPE_AUTO_CANCEL_LISTING,
            from: transferFrom,
            nft: nftData.id,
            tx_hash: log.transactionHash,
            timestamp: dayjs().unix(),
          },
        })
      await updateListingPoint(
        true,
        deletedOrder.maker,
        deletedOrder.contract_address,
        nftData.token_id,
        0,
        0,
        { strapi }
      )
      await updateFloorPrice({ strapi }, deletedOrder.contract_address)
      await updateOrdersCount(
        { strapi },
        deletedOrder.contract_address
      );
    }


  } catch (error) {
    console.error(`checkValidationAndConnectWithDB - error - ${error.message}`);
    dm.logError({ error, identifier: `checkValidationAndConnectWithDB | deleteSellOrderProcess`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }
}

