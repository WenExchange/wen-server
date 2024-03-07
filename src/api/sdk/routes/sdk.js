module.exports = {
  routes: [
    {
      method: "GET",
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
  ],
};
