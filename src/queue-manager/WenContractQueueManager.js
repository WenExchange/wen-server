const { wenContractListener } = require("../listener/wenContractListener");

let instance = null;
module.exports = class WenContractQueueManager {
  LOG_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new WenContractQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = (log) => {
    this.LOG_QUEUE.push(log)
    console.log(`[WEN] addQueue - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
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
      console.log(`[WEN] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const log = this.LOG_QUEUE.shift();
      try {
        await wenContractListener({strapi: this.strapi,event: log })
      } catch (error) {
        console.error(`[WEN] Processing Queue error - ${error.message}`);
      }
    }
    this.isProcessing = false;
  }

  

};
