const { ethers } = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const NFTMintingQueueManager = require("../queue-manager/NFTMintingQueueManager");
const TokenTransferQueueManager = require("../queue-manager/TokenTransferQueueManager");
const { validInteger } = require("../utils/helpers");

const transferListener = async ({ log, strapi }) => {
  try {
    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    try {
      const bigIntTokenId = BigInt(log.topics[3]);
    } catch (error) {
      return 
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
    console.error("transferListener - error", error.message);
  }
};




module.exports = { transferListener };
