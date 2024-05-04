const {
  wenETHContractListener,
} = require("../listener/wenETHContractListener");

let instance = null;
module.exports = class wenETHContractQueueManager {
  LOG_QUEUE = [];
  isProcessing = false;
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new wenETHContractQueueManager(strapi);
    }
    return instance;
  }

  /** Handlers */

  addQueue = (log) => {
    this.LOG_QUEUE.push(log);
    console.log(
      `[WEN] addQueue - ${this.LOG_QUEUE.length - 1} -> ${
        this.LOG_QUEUE.length
      }`
    );
    this.executeQueue();
  };

  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  };

  processQueue = async () => {
    console.log(`[WEN] processQueue`);
    this.isProcessing = true;

    while (this.LOG_QUEUE.length > 0) {
      console.log(
        `[WEN] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${
          this.LOG_QUEUE.length - 1
        }`
      );
      const log = this.LOG_QUEUE.shift();
      try {
        await wenETHContractListener({ strapi: this.strapi, event: log });
      } catch (error) {
        console.error(`[WEN] Processing Queue error - ${error.message}`);
      }
    }
    this.isProcessing = false;
  };
};
