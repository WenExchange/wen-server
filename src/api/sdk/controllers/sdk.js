"use strict";

/**
 * A set of functions called "actions" for `sdk`
 */

const SUCCESS_RESPONSE = 0;
const ERROR_RESPONSE = 1234;

module.exports = {
  getOrdersNonce: async (ctx, next) => {
    try {
      console.log(ctx.request.query);
      // TODO: Order Nonce 왜 구하는지 모르겠음
      const { maker, exchange, schema, count } = ctx.request.query;
      console.log("getOrderNonce : ", maker, exchange, schema, count);
      ctx.body = {
        data: { nonce: 0 },
        code: SUCCESS_RESPONSE,
      };
      return;
    } catch (err) {
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: `getOrderNonce Internal Error`,
      };
      return;
    }
  },
  getCollectionFees: async (ctx, next) => {
    try {
      // ctx.body = "ok";
      console.log(ctx.request.body.data);
      const data = ctx.request.body.data;
      const feeList = [];

      for (let item of data.data) {
        // contractAddress 로 값을 찾아온다.
        const r = await strapi.entityService.findMany(
          "api::collection.collection",
          {
            filters: {
              contract_address: {
                $eq: item.contractAddress,
              },
            },
          }
        );
        if (r.length == 1) {
          feeList.push({
            contractAddress: r[0].contract_address,
            protocolFeePoints: r[0].protocol_fee_point,
            protocolFeeAddress: r[0].protocol_fee_receiver,
            royaltyFeePoints: r[0].royalty_fee_point,
            royaltyFeeAddress: r[0].royalty_fee_receiver,
          });
        } else {
          ctx.body = {
            code: ERROR_RESPONSE,
            msg: `${item.contractAddress} doesn't exist on db`,
          };
          return;
        }
      }
      ctx.body = {
        data: { feeList: feeList },
        code: SUCCESS_RESPONSE,
      };
      return;
    } catch (err) {
      ctx.body = err;
    }
  },
};
