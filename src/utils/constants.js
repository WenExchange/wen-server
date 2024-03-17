const isProduction = true
const ethers = require("ethers");
module.exports = {
    API_TOKEN: {
        UPLOAD: "a000278940a18a8b20b47439c24e3c7cc9b9d5246dedffa636a398d45b9cd747978ce46bc48099c0224e1739f55f433e3c60ca1425b7c0b4c7bad9f8fdae5c02fdc8782e9ef8e75714563aab7908314763aab85d41b2b789e4769c2231eb2cfa6deca94d0bd5c5068799a3efff5c8bab7af71fb4b1e1f856d7a0c8cb1001e011"
    },
    NFT_TRADE_LOG_TYPE : {
        LISTING: "LISTING",
        BUYING: "BUYING",
        CANCEL: "CANCEL"
    },

    jsonRpcProvider: new ethers.providers.JsonRpcProvider(
        isProduction ? 
        "https://rpc.ankr.com/blast/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c"
      :
        "https://rpc.ankr.com/blast_testnet_sepolia/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c" )
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