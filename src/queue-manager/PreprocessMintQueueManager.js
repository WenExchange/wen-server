
const { PREPROCESS_TYPE, jsonRpcProvider, jsonRpcProvider_cron, DISCORD_INFO } = require("../utils/constants");
const { createNFTAtMint, fetchMetadata } = require("../listener/listingAtMint");
const { ethers } = require("ethers");
const ERC721 = require("../web3/abis/ERC721.json");
const DiscordManager = require("../discord/DiscordManager");

let instance = null;
module.exports = class PreprocessMintQueueManager {
  PROCESS_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new PreprocessMintQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  isValidAddingQueue = () => {
    return this.PROCESS_QUEUE.length === 0
  }

  addQueueWithArray = (preprocesses) => {
    if (!Array.isArray(preprocesses)) return
    if (preprocesses.length <= 0) return
    if (!preprocesses[0].type) return
    this.PROCESS_QUEUE = preprocesses
    this.executeQueue()
  }

  // addQueue = (process) => {
  //   this.PROCESS_QUEUE.push(process)
  //   console.log(`[PreprocessMintQueueManager] - ${this.PROCESS_QUEUE.length -1} -> ${this.PROCESS_QUEUE.length}`);
  //   this.executeQueue()
  // }

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    this.isProcessing = true

    while (this.PROCESS_QUEUE.length > 0) {
      console.log(`[PreprocessMintQueueManager] Processing Queue Start - ${this.PROCESS_QUEUE.length} -> ${this.PROCESS_QUEUE.length - 1}`);
      const process = this.PROCESS_QUEUE.shift();
      if (!process || !process.type) return
      switch (process.type) {
        case PREPROCESS_TYPE.MINT:
          await fetchMetadataAndUpdateNFT({strapi: this.strapi, process })
          break;
        case PREPROCESS_TYPE.DEPLOYING_COLLECTION:
          break

        default:
          break;
      }

    }
    this.isProcessing = false;
  }



};


const fetchMetadataAndUpdateNFT = async ({ strapi, process }) => {
  try {
    strapi.log.info(`fetchMetadataAndUpdateNFT - start`, process)
    const { nft, id, try_count } = process
  const collectionContract = new ethers.Contract(
    nft.collection.contract_address,
    ERC721,
    jsonRpcProvider_cron
  );
  const metadata = await fetchMetadata({ collectionContract, tokenId: nft.token_id, timeout: 20 * 1000 });
  strapi.log.info(`fetchMetadataAndUpdateNFT metadata`, metadata)
  if (metadata) {
    // update nft
    await strapi.db.query("api::nft.nft")
      .update({
        where: {
          id: nft.id
        },
        data: {
          ...metadata
        }
      })
    // delete preprocess
    await strapi.db.query("api::preprocess.preprocess").delete({
      where: {
        id: id
      },
    })

  } else {
    // update preprocess try count 
    await strapi.db.query("api::preprocess.preprocess").update({
      where: {
        id: id
      },
      data: {
        try_count: Number(try_count) + 1
      }
    })
  }

  } catch (error) {
    const dm = DiscordManager.getInstance(strapi)
    dm.logError({error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG})
  }
}