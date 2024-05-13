
const { PREPROCESS_TYPE, jsonRpcProvider, jsonRpcProvider_cron, DISCORD_INFO } = require("../utils/constants");
const { fetchMetadata } = require("../listener/listingAtMint");
const { ethers } = require("ethers");
const ERC721 = require("../web3/abis/ERC721.json");
const DiscordManager = require("../discord/DiscordManager");

let instance = null;
module.exports = class PreprocessMintQueueManager3 {
  PROCESS_QUEUE = [];
  isProcessing = false

  SECOND_PROCESS_QUEUE = [];
  isSecondProcessing = false

  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new PreprocessMintQueueManager3(strapi);
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

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    this.isProcessing = true

    while (this.PROCESS_QUEUE.length > 0) {
      console.log(`[PreprocessMintQueueManager3] Processing Queue Start - ${this.PROCESS_QUEUE.length} -> ${this.PROCESS_QUEUE.length - 1}`);
      const process = this.PROCESS_QUEUE.shift();
      if (!process || !process.type) return
      switch (process.type) {
        case PREPROCESS_TYPE.MINT:
          await fetchMetadataAndUpdateNFT({ strapi: this.strapi, process })
          break;
        case PREPROCESS_TYPE.DEPLOYING_COLLECTION:
          break

        default:
          break;
      }

    }
    this.isProcessing = false;
  }

  /** Second */

  isValidSecondAddingQueue = () => {
    return this.SECOND_PROCESS_QUEUE.length === 0
  }


  addSecondQueueWithArray = (preprocesses) => {
    if (!Array.isArray(preprocesses)) return
    if (preprocesses.length <= 0) return
    if (!preprocesses[0].type) return
    this.SECOND_PROCESS_QUEUE = preprocesses
    this.executeSecondQueue()
  }

  executeSecondQueue = () => {
    if (!this.isSecondProcessing) {
      this.processSecondQueue();
    }
  }

  processSecondQueue = async () => {
    this.isSecondProcessing = true

    while (this.SECOND_PROCESS_QUEUE.length > 0) {
      console.log(`[PreprocessMintQueueManager3] Second Processing Queue Start - ${this.SECOND_PROCESS_QUEUE.length} -> ${this.SECOND_PROCESS_QUEUE.length - 1}`);
      const process = this.SECOND_PROCESS_QUEUE.shift();
      if (!process || !process.type) return
      switch (process.type) {
        case PREPROCESS_TYPE.MINT:
          await fetchMetadataAndUpdateNFT({ strapi: this.strapi, process })
          break;
        case PREPROCESS_TYPE.DEPLOYING_COLLECTION:
          break

        default:
          break;
      }

    }
    this.isSecondProcessing = false;
  }




};


const fetchMetadataAndUpdateNFT = async ({ strapi, process }) => {
  try {
    strapi.log.info(`fetchMetadataAndUpdateNFT - start`)
    const { nft, id, try_count } = process
    const existPreprocess = await strapi.db.query("api::preprocess.preprocess")
      .findOne({
        where: {
          id
        }
      })
    if (!existPreprocess) return
    const collectionContract = new ethers.Contract(
      nft.collection.contract_address,
      ERC721,
      jsonRpcProvider_cron
    );
    let timeout = 5 * 1000
    const isSecondTry = Number(try_count) === 2
    if (isSecondTry) timeout = 15 * 1000
    const metadata = await fetchMetadata({ collectionContract, tokenId: nft.token_id, timeout });
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

      strapi.log.info(`fetchMetadataAndUpdateNFT - complete - ${metadata.name}`)

    } else {
      strapi.log.info(`fetchMetadataAndUpdateNFT - fail - ${nft.name}`)
      if (isSecondTry) {
        // delete preprocess
        await strapi.db.query("api::preprocess.preprocess").delete({
          where: {
            id: id
          },
        })
        await strapi.db.query("api::nft.nft")
        .update({
          where: {
            id: nft.id
          },
          data: {
            is_valid_metadata: false
          }
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

    }

  } catch (error) {
    strapi.log.error(error.message)
    // const dm = DiscordManager.getInstance(strapi)
    // dm.logError({ error, identifier: "Cron - preprocess", channelId: DISCORD_INFO.CHANNEL.PREPROCESS_ERROR_LOG })
  }
}

