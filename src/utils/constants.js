const isProduction = process.env.NODE_ENV === "production"
// const isProduction = true
const {ethers} = require("ethers");
module.exports = {
  SERVER_TYPE: {
    API: "API",
    BOT: "BOT"
  },
  CONTRACT_ADDRESSES : {
    WEN_EX: "0x5958dC6cdc5df14b92699eABf17c7a19A1B22712",
    EL_EX: "0x4196b39157659bf0de9ebf6e505648b7889a39ce",
    MIN_EX: "0x00000000000000adc04c56bf30ac9d3c0aaf14dc"
  },
  EVENT_TYPE :{
    "ERC721SellOrderFilled": "0x9c248aa1a265aa616f707b979d57f4529bb63a4fc34dc7fc61fdddc18410f74e",
    "ERC721BuyOrderFilled": "0xd90a5c60975c6ff8eafcf02088e7b50ae5d9e156a79206ba553df1c4fb4594c2",
    "ERC1155SellOrderFilled": "0xfcde121a3f6a9b14a3ce266d61fc00940de86c4d8c1d733fe62d503ae5d99ff9",
    "ERC1155BuyOrderFilled" : "0x105616901449a64554ca9246a5bbcaca973b40b3c0055e5070c6fa191618d9f3",
    "ERC721OrderCancelled":"0xa015ad2dc32f266993958a0fd9884c746b971b254206f3478bc43e2f125c7b9e",
    "OrderFulfilled": "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31",
    
  },
  EX_TYPE: {
    WEN: "WEN",
    ELEMENT: "ELEMENT"
  },

    API_TOKEN: {
        UPLOAD: "a000278940a18a8b20b47439c24e3c7cc9b9d5246dedffa636a398d45b9cd747978ce46bc48099c0224e1739f55f433e3c60ca1425b7c0b4c7bad9f8fdae5c02fdc8782e9ef8e75714563aab7908314763aab85d41b2b789e4769c2231eb2cfa6deca94d0bd5c5068799a3efff5c8bab7af71fb4b1e1f856d7a0c8cb1001e011"
    },
    NFT_TRADE_LOG_TYPE : {
        LISTING: "LISTING",
        BUYING: "BUYING",
        CANCEL: "CANCEL"
    },


  jsonRpcProvider: new ethers.providers.JsonRpcProvider(
    isProduction
      ? "https://rpc.ankr.com/blast/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c"
      : "https://rpc.ankr.com/blast_testnet_sepolia/d347c8e224d87a27991df14f8963b6b858f52617aec0cc0d1278bca0fcb0178c"
  ),
  jsonRpcProvider_cron: new ethers.providers.JsonRpcProvider(
    isProduction
      ? "https://rpc.ankr.com/blast/73a9b5e44df22487ad7bab31df917958efd0f16bc7d83fcec50a565e1a0c1aee"
      : "https://rpc.ankr.com/blast_testnet_sepolia/73a9b5e44df22487ad7bab31df917958efd0f16bc7d83fcec50a565e1a0c1aee"
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
  PROTOCOL_FEE: {
    RECEIVER: "0x4123B6B29006Ed7160B2EEDB89A0c062F976b511",
    POINT: 200
  }

  ,
  IPFS: {
    GATEWAY_URL: "https://wen-ex.myfilebase.com/ipfs/"
  }
};
