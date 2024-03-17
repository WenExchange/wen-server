const isProduction = true;
const ethers = require("ethers");
module.exports = {
  NFT_TRADE_LOG_TYPE: {
    LISTING: "LISTING",
    BUYING: "BUYING",
    CANCEL: "CANCEL",
  },

  jsonRpcProvider: new ethers.providers.JsonRpcProvider(
    isProduction
      ? "https://rpc.ankr.com/blast/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c"
      : "https://rpc.ankr.com/blast_testnet_sepolia/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c"
  ),
  NFT_LOG_TYPE: {
    LOG_TYPE_SALE: "SALE",
    LOG_TYPE_TRANSFER: "TRANSFER",
    LOG_TYPE_LISTING: "LISTING",
    LOG_TYPE_OFFER: "OFFER",
    LOG_TYPE_COLLECTION_OFFER: "COLLECTION_OFFER",
    LOG_TYPE_CANCEL_LISTING: "CANCEL_LISTING",
    LOG_TYPE_AUTO_CANCEL_LISTING: "AUTO_CANCEL_LISTING", // 유저가 더이상 BUYER 가 아닌 경우
    LOG_TYPE_CANCEL_OFFER: "CANCEL_OFFER",
    LOG_TYPE_MINT: "MINT",
  },
  WEN_EX_CONTRACT_ADDRESS: "0x5958dC6cdc5df14b92699eABf17c7a19A1B22712",
};
