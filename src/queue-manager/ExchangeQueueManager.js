
const { elementContractListener } = require("../listener/elementContractListener");
const { wenContractListener } = require("../listener/wenContractListener");
const {
  mintifyContractListener,
} = require("../listener/mintifyContractListener");

const {EX_TYPE} = require("../utils/constants")
let instance = null;
module.exports = class ExchangeQueueManager {
  WEN_QUEUE = [];
  is_WEN_processing = false
  ELEMENT_QUEUE = []
  is_ELEMENT_processing = false
  MINTIFY_QUEUE = []
  is_MINTIFY_processing = false

  constructor(strapi) {
    this.strapi = strapi;
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new ExchangeQueueManager(strapi);
    }
    return instance;
  }


  /** Handlers */

  addQueue = ({event, type}) => {
    this[`${type}_QUEUE`].push(event)
    if (!Object.keys(EX_TYPE).includes(type)) {
      console.error(`Invalid type - ${type}`);
      return 
    }
    console.log(`[${type}] ExchangeQueueManager | addQueue - ${this[`${type}_QUEUE`].length -1} -> ${this[`${type}_QUEUE`].length}`);
    this.executeQueue(type)
  }

  executeQueue = (type) => {
    if (!this[`is_${type}_processing`]) {
      this.processQueue(type);
    }
  }

  processQueue = async (type) => {
    this[`is_${type}_processing`] = true

    while (this[`${type}_QUEUE`].length > 0) {
      console.log(`[${type}] ExchangeQueueManager | Processing Queue Start - ${this[`${type}_QUEUE`].length} -> ${this[`${type}_QUEUE`].length - 1}`);
      const event = this[`${type}_QUEUE`].shift();
      try {
        switch (type) {
          case EX_TYPE.WEN:
            await wenContractListener({strapi: this.strapi, event: event })
            break;
          case EX_TYPE.ELEMENT:
            await elementContractListener({strapi: this.strapi, event: event })
            break
          case EX_TYPE.MINTIFY:
            await mintifyContractListener({strapi: this.strapi, event: event })
            break
        
          default:
            break;
        }
      } catch (error) {
        console.error(`[${type}] | processQueue error - ${error}`);
      }
    }
    this.isProcessing = false;
  }

  
  

};
