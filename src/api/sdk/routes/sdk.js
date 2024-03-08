module.exports = {
  routes: [
    {
      method: "GET", // But If you query nonce, order nonces goes up.
      path: "/orders/nonce",
      handler: "sdk.getOrdersNonce",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/collection/fee",
      handler: "sdk.getCollectionFees",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/orders/postBatch",
      handler: "sdk.postOrderBatch",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
