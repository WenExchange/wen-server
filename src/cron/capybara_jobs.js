const dayjs = require("dayjs");

const { ethers } = require("ethers");
const { jsonRpcProvider_cron } = require("../utils/constants");

// FIXME: JOYCE
const capyJobs = async ({ strapi }) => {
  try {

  } catch (error) {
    strapi.log.error(`capybara jobs error - ${error.message}`)
  }
  
  
};


module.exports = {
  capyJobs
};
