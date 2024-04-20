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




module.exports = { transferListener };
