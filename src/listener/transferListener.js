const { ethers } = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE,
  CONTRACT_ADDRESSES,
  DISCORD_INFO,
} = require("../utils/constants");
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { validInteger } = require("../utils/helpers");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");
const NFTMintingQueueManager = require("../queue-manager/NFTMintingQueueManager");
const TokenTransferQueueManager = require("../queue-manager/TokenTransferQueueManager");
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

const transferListener = async ({ log, strapi }) => {
  try {
    const ccm = CollectionCacheManager.getInstance(strapi);
    const myCollections = ccm.getCollectionAddresses();
    if (!myCollections.includes(log.address.toLowerCase())) return;

    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    const transferTo = `0x${log.topics[2].slice(-40)}`;
    const bigIntTokenId = BigInt(log.topics[3]);

    const isValidTokenId = validInteger(bigIntTokenId);
    if (!isValidTokenId) {
      throw new Error(
        `Token id is overflow - from: ${transferFrom} to: ${transferTo} token_idx: ${bigIntTokenId.toString()}`
      );
    }

    if (transferFrom === "0x0000000000000000000000000000000000000000") {
      const nmqm = NFTMintingQueueManager.getInstance(strapi)
      nmqm.addQueue(log)
    } else {
      const tqm = TokenTransferQueueManager.getInstance(strapi)
      tqm.addQueue(log);
    }
    // Mint 제외
  } catch (error) {
    console.error("transferListener - error", error);
  }
};

const checkValidationAndConnectWithDB = async ({ strapi, log }) => {
  const transferFrom = `0x${log.topics[1].slice(-40)}`;
  const transferTo = `0x${log.topics[2].slice(-40)}`;
  const bigIntTokenId = BigInt(log.topics[3]);
  const tokenId = Number(bigIntTokenId);

  /** Mint */
  // if (transferFrom === "0x0000000000000000000000000000000000000000") {
  //   await createNFTAtMint({ log, strapi });
  //   return;
  // }

  // Buy Event 제외
  const tx = await jsonRpcProvider.getTransaction(log.transactionHash);
  const receipt = await tx.wait();
  const receiptLogs = receipt.logs;
  if (!Array.isArray(receiptLogs)) throw new Error("Invalid receiptLogs");
  const receiptTopics = receiptLogs.map((log) => {
    if (Array.isArray(log.topics) && log.topics.length > 0)
      return log.topics[0];
    return "";
  });
  const isIncludeBuyEventType = checkReceiptTopicsForEventTypes(receiptTopics);

  if (isIncludeBuyEventType) {
    const exchangeAddresses = Object.keys(CONTRACT_ADDRESSES).map((key) =>
      CONTRACT_ADDRESSES[key].toLowerCase()
    );
    const isIncludeWenOrElExchange = exchangeAddresses.includes(
      tx.to.toLowerCase()
    );
    if (isIncludeWenOrElExchange) {
      return;
    }
  }

  // 1. Get NFT
  const nftData = await strapi.db.query("api::nft.nft").findOne({
    populate: {
      sell_order: true
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

  // 1-1. If nft doesn't exist, return
  if (!nftData) {
    console.log(
      `transferListener - There is no NFT DATA contract_address: ${log.address} | token_id: ${tokenId}`
    );
    return;
  }

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

  if (existTrasferLog) return

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
  } catch (error) {
    dm.logError({ error, identifier: `checkValidationAndConnectWithDB | update NFT`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    throw new Error(error)
  }

  try {
    await updateOwnerCount({ strapi }, log.address);
  } catch (error) {
    dm.logError({ error, identifier: `checkValidationAndConnectWithDB | updateOwnerCount`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }

  try {
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
  } catch (error) {
    dm.logError({ error, identifier: `checkValidationAndConnectWithDB | create nft trade log`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }


  // 리스팅 되있는 상황에서 transfer
  if (nftData.sell_order) {
    await deleteSellOrderProcess({ strapi, nftData, log, transferFrom, dm })
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
      .delete("api::order.order", nftData.sell_order.id, {
        populate: { nft: true },
      })
    if (deletedOrder) {
      await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            ex_type: EX_TYPE.WEN,
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
        deletedOrder.nft.token_id,
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


module.exports = { transferListener, checkValidationAndConnectWithDB };
