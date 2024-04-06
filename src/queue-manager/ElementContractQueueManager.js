const { elementContractListener } = require("../listener/elementContractListener");

let instance = null;
module.exports = class ElementContractQueueManager {
  LOG_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new ElementContractQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = (log) => {
    this.LOG_QUEUE.push(log)
    console.log(`[ELEMENT] addQueue - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
    this.executeQueue()
  }

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    console.log(`[ELEMENT] processQueue`);
    this.isProcessing = true

    while (this.LOG_QUEUE.length > 0) {
      console.log(`[ELEMENT] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const log = this.LOG_QUEUE.shift();
      try {
        await elementContractListener({strapi: this.strapi,event: log })
      } catch (error) {
        console.error(`[ELEMENT] Processing Queue error - ${error.message}`);
      }
    }
    this.isProcessing = false;
  }

  

};
