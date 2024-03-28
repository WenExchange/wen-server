const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const {transferListener, checkValidationAndConnectWithDB} = require("../listener/transferListener");
const { validInteger, wait } = require("../utils/helpers");

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
    console.log(`addQueue - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
    this.executeQueue()
  }

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    // for test
    const ccm = CollectionCacheManager.getInstance(this.strapi);
    
    // --- 
    this.isProcessing = true

    while (this.LOG_QUEUE.length > 0) {
      console.log(`Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const log = this.LOG_QUEUE.shift();
      try {
        await checkValidationAndConnectWithDB({strapi: this.strapi,log })
      } catch (error) {
        console.error(`transferListener error - ${error}`);
      }
    }
    this.isProcessing = false;
  }

  

};
