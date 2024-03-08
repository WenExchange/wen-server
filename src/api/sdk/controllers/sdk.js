"use strict";

/**
 * A set of functions called "actions" for `sdk`
 */

const SUCCESS_RESPONSE = 0;
const ERROR_RESPONSE = 1234;

//Request Log Type
const UPDATE_MAKER_NONCE = "UPDATE_MAKER_NONCE";

function createUuidv4() {
  let uuid = crypto.randomUUID();
  return uuid;
}

https: module.exports = {
  getOrdersNonce: async (ctx, next) => {
    try {
      const { maker, schema, count } = ctx.request.query;
      console.log("getOrderNonce : ", maker, schema, count);

      let makerNonce;
      const uuid = createUuidv4();

      // 1. 현재 maker 의 nonce 값을 가져온다.
      // contractAddress 로 값을 찾아온다.
      const r = await strapi.entityService.findMany(
        "api::exchange-user.exchange-user",
        {
          filters: {
            address: {
              $eq: maker,
            },
          },
        }
      );
      if (r.length == 1) {
        makerNonce = r[0].maker_nonce;
        // 2. maker의 기존 nonce 값을 count 만큼 상승시킨다.

        const entry = await strapi.entityService.update(
          "api::exchange-user.exchange-user",
          r[0].id,
          {
            data: {
              maker_nonce: makerNonce + parseInt(count),
            },
          }
        );
        // 3. request log 를 찍는다.
        await strapi.entityService.create("api::request-log.request-log", {
          data: {
            request_uuid: uuid,
            type: UPDATE_MAKER_NONCE,
            original_nonce: makerNonce,
            new_nonce: makerNonce + parseInt(count),
            exchange_user: r[0].id,
          },
        });
      } else {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `${maker} doesn't exist on db`,
        };
        return;
      }

      // 4. nonce 값을 return 한다.
      ctx.body = {
        data: { nonce: makerNonce, requestUuid: uuid },
        code: SUCCESS_RESPONSE,
      };
      return;
    } catch (err) {
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: err.message,
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
  postOrderBatch: async (ctx, next) => {
    try {
      // ctx.body = "ok";
      console.log(ctx.request.body.data.basicCollections[0].items[0]);
      const data = ctx.request.body.data.basicCollections.items;

      //   exchange: string;
      // maker: string;
      // listingTime: number;
      // expirationTime: number;
      // startNonce: number;
      // paymentToken: string;
      // platformFeeRecipient: string;
      // basicCollections: Collection[];
      // collections: Collection[];
      // hashNonce: string;
      // chain: string;

      // //signed
      // v: number;
      // r: string;
      // s: string;
      // hash: string;

      // //collection
      // nftAddress: string;
      // platformFee: number;
      // royaltyFeeRecipient: string;
      // royaltyFee: number;
      // items: OrderItem[];

      // //orderItem
      // erc20TokenAmount: string;
      // nftId: string;

      return;
    } catch (err) {
      ctx.body = err;
    }
  },
};

// {
//   exchange: '0xd75104c9c2aec1594944c8f3a2858c62deeae91b',
//   maker: '0xe0c78c90e25165cf8707ece8664916d1ea0b7994',
//   listingTime: 1709871949,
//   expirationTime: 1710476809,
//   startNonce: 0,
//   paymentToken: '0x0000000000000000000000000000000000000000',
//   platformFeeRecipient: '0xe0c78c90e25165cf8707ece8664916d1ea0b7994',
//   basicCollections: [
//     {
//       nftAddress: '0xc4d5966e0c4f37762414d03f165e7cbf2dc247fd',
//       platformFee: 200,
//       royaltyFeeRecipient: '0xfb6fb1c53943d6797add7e4228c44c909e993023',
//       royaltyFee: 500,
//       items: [{ erc20TokenAmount: '10000000000000000', nftId: '1' }]
//     },
//     {
//       nftAddress: '0xec1c6ebb2edef02422bbbcaa3fb9b39363b9d47d',
//       platformFee: 200,
//       royaltyFeeRecipient: '0xfb6fb1c53943d6797add7e4228c44c909e993023',
//       royaltyFee: 600,
//       items: [{ erc20TokenAmount: '10000000000000000', nftId: '1' }]
//     }
//   ],
//   collections: [],
//   hashNonce: '0',
//   chain: 'wen',
//   v: 28,
//   r: '0xf811d29d0ef04aa2f917276490d2fbcc7a7fd96d086bd442931f4358de82db6e',
//   s: '0x7a9aba21cb08285249ec00199bdc2553539b1dfb4c1a2c9f949aa8cd5932060e',
//   hash: '0x6b64b86c6a4524d8ba22ffab1b05178045fe5d6367ea791faf00f027a309a646'
// }
