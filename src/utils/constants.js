const isProduction = false
const ethers = require("ethers");
module.exports = {
    NFT_TRADE_LOG_TYPE : {
        LISTING: "LISTING",
        BUYING: "BUYING",
        CANCEL: "CANCEL"
    },

    jsonRpcProvider: new ethers.providers.JsonRpcProvider(
        isProduction ? 
        "https://rpc.ankr.com/blast/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" :
        "https://rpc.ankr.com/blast_testnet_sepolia/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" )
    ,
    NFT_LOG_TYPE: {
        LOG_TYPE_SALE: "SALE",
        LOG_TYPE_TRANSFER:"TRANSFER",
 LOG_TYPE_LISTING : "LISTING",
 LOG_TYPE_OFFER : "OFFER",
 LOG_TYPE_COLLECTION_OFFER : "COLLECTION_OFFER",
 LOG_TYPE_CANCEL_LISTING : "CANCEL_LISTING",
 LOG_TYPE_AUTO_CANCEL_LISTING : "AUTO_CANCEL_LISTING", // 유저가 더이상 BUYER 가 아닌 경우
 LOG_TYPE_CANCEL_OFFER : "CANCEL_OFFER",
 LOG_TYPE_MINT : "MINT",
    }
}