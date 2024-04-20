
const { checkValidationAndConnectWithDB} = require("../listener/transferListener");

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
