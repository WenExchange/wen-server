const { mintifyContractListener } = require("../listener/mintifyContractListener");

let instance = null;
module.exports = class MintifyContractQueueManager {
  LOG_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new MintifyContractQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = (log) => {
    this.LOG_QUEUE.push(log)
    console.log(`[MINTIFY] addQueue - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
    this.executeQueue()
  }

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    console.log(`[MINTIFY] processQueue`);
    this.isProcessing = true

    while (this.LOG_QUEUE.length > 0) {
      console.log(`[MINTIFY] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const log = this.LOG_QUEUE.shift();
      try {
        await mintifyContractListener({strapi: this.strapi,event: log })
      } catch (error) {
        console.error(`[MINTIFY] Processing Queue error - ${error.message}`);
      }
    }
    this.isProcessing = false;
  }

  

};
