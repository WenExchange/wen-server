
const { createNFTAtMint } = require("../listener/listingAtMint");

let instance = null;
module.exports = class NFTMintingQueueManager {
  LOG_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new NFTMintingQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = (log) => {
    this.LOG_QUEUE.push(log)
    console.log(`[NFTMintingQueueManager] - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
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
      console.log(`[NFTMintingQueueManager] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const log = this.LOG_QUEUE.shift();
      await createNFTAtMint({strapi: this.strapi,log })
    }
    this.isProcessing = false;
  }

  

};
