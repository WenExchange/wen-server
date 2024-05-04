module.exports = {
  routes: [
    {
      method: "GET", // But If you query nonce, order nonces goes up.
      path: "/sdk/orders/nonce",
      handler: "sdk.getOrdersNonce",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/sdk/collection/fee",
      handler: "sdk.getCollectionFees",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/sdk/batchSignedOrders",
      handler: "sdk.getBatchSignedOrders",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/sdk/orders/postBatch",
      handler: "sdk.postOrderBatch",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/sdk/orders/list",
      handler: "sdk.getOrdersList",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST", // But If you query nonce, order nonces goes up.
      path: "/sdk/orders/encodeTradeDataByHash",
      handler: "sdk.encodeTradeDataByHash",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST", // But If you query nonce, order nonces goes up.
      path: "/sdk/orders/fetchExchangeDataByHash",
      handler: "sdk.fetchExchangeDataByHash",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST", // But If you query nonce, order nonces goes up.
      path: " /sdk/orders/fetchBatchBuyExchangeDataByHash",
      handler: "sdk.fetchBatchBuyExchangeDataByHash",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST", // But If you query nonce, order nonces goes up.
      path: "/sdk/orders/post",
      handler: "sdk.postBuyOrder",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/sdk/orders/getCollectionOfferWall",
      handler: "sdk.getCollectionOfferWall",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/sdk/orders/getMyBuyOrders",
      handler: "sdk.getMyBuyOrders",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/sdk/orders/getSellMyNFTsInfo",
      handler: "sdk.getSellMyNFTsInfo",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
