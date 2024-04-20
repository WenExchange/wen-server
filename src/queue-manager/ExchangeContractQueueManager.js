const { mintifyContractListener } = require("../listener/mintifyContractListener");
const {EX_TYPE} = require("../utils/constants")

let instance = null;
module.exports = class ExchangeContractQueueManager {
  LOG_QUEUE = [];
  isProcessing = false
  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new ExchangeContractQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = ({ex_type, log}) => {
    this.LOG_QUEUE.push({
      ex_type,
      log
    })
    
    console.log(`[ExchangeContractQueueManager] addQueue - ${this.LOG_QUEUE.length -1} -> ${this.LOG_QUEUE.length}`);
    this.executeQueue()
  }
  executeQueue = () => {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  processQueue = async () => {
    console.log(`[ExchangeContractQueueManager] processQueue`);
    this.isProcessing = true
    while (this.LOG_QUEUE.length > 0) {
      

      console.log(`[ExchangeContractQueueManager] Processing Queue Start - ${this.LOG_QUEUE.length} -> ${this.LOG_QUEUE.length - 1}`);
      const {ex_type, log} = this.LOG_QUEUE.shift();
      try {
        switch (ex_type) {
          case EX_TYPE.MINTIFY:
          case EX_TYPE.OPENSEA:
            await mintifyContractListener({strapi: this.strapi,event: log, ex_type })
            break
        
          default:
            break;
        }
      } catch (error) {
        console.error(`[ExchangeContractQueueManager] Processing Queue error - ${error.message}`);
      }
    }
    this.isProcessing = false;
  }

  

};
