const { ethers } = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const NFTMintingQueueManager = require("../queue-manager/NFTMintingQueueManager");
const TokenTransferQueueManager = require("../queue-manager/TokenTransferQueueManager");

const transferListener = async ({ log, strapi }) => {
  try {
    const ccm = CollectionCacheManager.getInstance(strapi);
    const myCollections = ccm.getCollectionAddresses();
    if (!myCollections.includes(log.address.toLowerCase())) return;

    const transferFrom = `0x${log.topics[1].slice(-40)}`;
    const transferTo = `0x${log.topics[2].slice(-40)}`;
    const bigIntTokenId = BigInt(log.topics[3]);

    // const isValidTokenId = validInteger(bigIntTokenId);
    // if (!isValidTokenId) {
    //   throw new Error(
    //     `Token id is overflow - from: ${transferFrom} to: ${transferTo} token_idx: ${bigIntTokenId.toString()}`
    //   );
    // }

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
