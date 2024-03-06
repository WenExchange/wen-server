"use strict";
require("dotenv").config();
const dayjs = require("dayjs");
const CryptoJS = require("crypto-js");

/**
 * collection controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController('api::collection.collection')
