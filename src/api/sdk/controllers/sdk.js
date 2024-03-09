"use strict";

/**
 * A set of functions called "actions" for `sdk`
 */

const SUCCESS_RESPONSE = 0;
const ERROR_RESPONSE = 1234;

const SIGNATURE_TYPE_EIP712 = 0;
const SIGNATURE_TYPE_PRESIGNED = 1;

const SCHEMA_ERC721 = "ERC721";

//Request Log Type
const UPDATE_MAKER_NONCE = "UPDATE_MAKER_NONCE";
const POST_BATCH = "POST_BATCH";
const GET_BATCH_SIGNED_ORDERS = "GET_BATCH_SIGNED_ORDERS";
function createUuidv4() {
  let uuid = crypto.randomUUID();
  return uuid;
}

module.exports = {
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
        await createRequestLog(
          uuid,
          UPDATE_MAKER_NONCE,
          {
            original_nonce: makerNonce,
            new_nonce: makerNonce + parseInt(count),
          },
          r[0].id
        );
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
      // console.log(ctx.request.body.data);
      const data = ctx.request.body.data;

      // 1. check if the user exist.
      // contractAddress 로 값을 찾아온다.
      const r = await strapi.entityService.findMany(
        "api::exchange-user.exchange-user",
        {
          filters: {
            address: {
              $eq: data.maker,
            },
          },
        }
      );
      console.log(r[0].address);
      if (r.length != 1) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `address ${data.maker} doesn't exist on db`,
        };
        return;
      }

      /// 2. check if all the collection in the list exist
      let collectionIdMap = new Map();
      if (data.basicCollections) {
        for (let item of data.basicCollections) {
          const r = await strapi.entityService.findMany(
            "api::collection.collection",
            {
              filters: {
                contract_address: {
                  $eq: item.nftAddress,
                },
              },
            }
          );
          if (r.length != 1) {
            ctx.body = {
              code: ERROR_RESPONSE,
              msg: `contract ${item.nftAddress} doesn't exist on collection table`,
            };
            return;
          } else {
            collectionIdMap[item.nftAddress] = r[0].id;
          }
        }
      }

      if (data.collections) {
        for (let item of data.collections) {
          const r = await strapi.entityService.findMany(
            "api::collection.collection",
            {
              filters: {
                contract_address: {
                  $eq: item.nftAddress,
                },
              },
            }
          );
          if (r.length != 1) {
            ctx.body = {
              code: ERROR_RESPONSE,
              msg: `contract ${item.nftAddress} doesn't exist on collection table`,
            };
            return;
          } else {
            collectionIdMap[item.nftAddress] = r[0].id;
          }
        }
      }
      // 3. Get Total Item Count (Order Count)
      let totalItemCount = 0;
      if (data.basicCollections) {
        for (let item of data.basicCollections) {
          totalItemCount += item.items.length;
        }
      }

      if (data.collections) {
        for (let item of data.collections) {
          totalItemCount += item.items.length;
        }
      }

      const exchangeDataObject = {
        basicCollections: data.basicCollections,
        collections: data.collections,
        startNonce: data.startNonce,
        nonce: data.startNonce + totalItemCount - 1,
        hashNonce: data.hashNonce,
        platformFeeRecipient: data.platformFeeRecipient,
        v: data.v,
        r: data.r,
        s: data.s,
        listingTime: data.listingTime,
        expirationTime: data.expirationTime,
        maker: data.maker,
        hash: data.hash,
        paymentToken: data.paymentToken,
        signatureType: SIGNATURE_TYPE_EIP712,
      };

      console.log(
        "exchangeDataObject , :",
        exchangeDataObject.basicCollections[0]
      );

      // 3. Upload batch signed order
      const batchSignedOrder = await strapi.entityService.create(
        "api::batch-signed-order.batch-signed-order",
        {
          data: {
            exchange_data: JSON.stringify(exchangeDataObject),
            exchange_user: r[0].id,
          },
        }
      );
      const successList = [];
      const failList = [];

      let orderIndex = data.startNonce;
      let mCollection;
      let mItem;
      if (data.basicCollections) {
        try {
          for (let collection of data.basicCollections) {
            mCollection = collection;
            for (let item of collection.items) {
              mItem = item;
              let orderUuid = createUuidv4();
              console.log("item price : ", item.erc20TokenAmount);

              await strapi.entityService.create("api::order.order", {
                data: {
                  order_id: orderUuid,
                  batch_signed_order: batchSignedOrder.id,
                  schema: SCHEMA_ERC721,
                  price: item.erc20TokenAmount,
                  token_id: item.nftId,
                  quantity: 1, //TODO : ERC1155 지원하려면 바뀌어야함.
                  order_hash: data.hash + "_" + orderIndex++,
                  collection: collectionIdMap[collection.nftAddress],
                },
              });

              successList.push({
                assetContract: collection.nftAddress,
                assetTokenId: item.nftId,
                orderId: orderUuid,
              });
            }
          }
        } catch (error) {
          failList.push({
            assetContract: mCollection.nftAddress,
            assetTokenId: mItem.nftId,
          });
        }
      }

      if (data.collections) {
        // TODO : Collections 와 BasicCollections 의 구분을 만들어야하지 않을까?
        try {
          for (let collection of data.collections) {
            mCollection = collection;
            for (let item of collection.items) {
              mItem = item;
              let orderUuid = createUuidv4();
              console.log("item price : ", item.erc20TokenAmount);

              await strapi.entityService.create("api::order.order", {
                data: {
                  order_id: orderUuid,
                  batch_signed_order: batchSignedOrder.id,
                  schema: SCHEMA_ERC721,
                  price: item.erc20TokenAmount,
                  token_id: item.nftId,
                  quantity: 1, //TODO : ERC1155 지원하려면 바뀌어야함.
                  order_hash: data.hash + "_" + orderIndex++,
                  collection: collectionIdMap[collection.nftAddress],
                },
              });

              successList.push({
                assetContract: collection.nftAddress,
                assetTokenId: item.nftId,
                orderId: orderUuid,
              });
            }
          }
        } catch (error) {
          failList.push({
            assetContract: mCollection.nftAddress,
            assetTokenId: mItem.nftId,
          });
        }
      }

      // 5. create Log
      const requestUuid = createUuidv4();
      await createRequestLog(
        requestUuid,
        POST_BATCH,
        { successList, failList },
        r[0].id
      );

      ctx.body = {
        data: { successList, failList },
        code: SUCCESS_RESPONSE,
      };
      return;
    } catch (err) {
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: err.msg,
      };
      return;
    }
  },
  getBatchSignedOrders: async (ctx, next) => {
    try {
      const data = ctx.request.body.data;
      console.log(data);

      // 1. check if the user exist.
      const userData = await strapi.entityService.findMany(
        "api::exchange-user.exchange-user",
        {
          filters: {
            address: {
              $eq: data.buyer,
            },
          },
        }
      );
      if (userData.length != 1) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `address ${data.buyerr} doesn't exist on db`,
        };
        return;
      }

      /// 2. check if all the collection in the list exist
      let collectionIdMap = new Map();
      if (data) {
        for (let item of data.data) {
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
          if (r.length != 1) {
            ctx.body = {
              code: ERROR_RESPONSE,
              msg: `contract ${item.contractAddress} doesn't exist on collection table`,
            };
            return;
          } else {
            collectionIdMap[item.contractAddress] = r[0].id;
          }
        }
      }

      /// 3. get token data
      // TODO change to wenETH
      const token = await getTokenData("eth");

      /// 4. get response data
      let commonData = [];
      for (let item of data.data) {
        if (item.callFuncName == "buyERC721Ex") {
          const r = await strapi.db.query("api::order.order").findMany({
            where: {
              token_id: item.tokenId,
              collection: collectionIdMap[item.contractAddress],
              is_valid: true,
            },
            orderBy: { createdAt: "DESC" }, // 가장최근 Data TODO
            populate: { collection: true, batch_signed_order: true },
          });
          if (r.length === 0) {
            ctx.body = {
              code: ERROR_RESPONSE,
              msg: `No order for ${item.contractAddress} token_id : ${item.tokenId}`,
            };
            return;
          }
          const orderObj = JSON.parse(r[0].batch_signed_order.exchange_data);
          const validationResult = await _validateOrder(orderObj);

          if (!validationResult.result) {
            ctx.body = {
              code: ERROR_RESPONSE,
              msg: `validation failed : reason ${validationResult.reason} order id : ${r[0].order_id}`,
            };
            return;
          }

          // 5. get NFT Price
          const NFTPrice = await getNftPrice(
            orderObj,
            item.tokenId,
            item.contractAddress.toLowerCase()
          );
          // If validation result is true add data.
          commonData.push({
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            orderHash: r[0].batch_signed_order.order_hash,
            quantity: 1, // TODO ERC 1155
            tokenContract: token,
            schema: SCHEMA_ERC721,
            buyer: data.buyer,
            toAddress: orderObj.maker,
            exchangeData: r[0].batch_signed_order.exchange_data,
            price: NFTPrice.price,
          });
        }
      }
      const requestUuid = createUuidv4();
      await createRequestLog(
        requestUuid,
        GET_BATCH_SIGNED_ORDERS,
        {},
        userData[0].id
      );
      ctx.body = {
        code: SUCCESS_RESPONSE,
        data: { commonData: commonData },
        requestUuid: requestUuid,
      };
      return;

      console.log("list : ", commonData);
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: error.msg,
      };
      return;
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

async function getTokenData(symbol) {
  const r = await strapi.db.query("api::token.token").findOne({
    where: {
      symbol: symbol,
    },
  });
}

async function createRequestLog(uuid, type, data, userId) {
  // 3. request log 를 찍는다.
  const r = await strapi.entityService.create("api::request-log.request-log", {
    data: {
      request_uuid: uuid,
      type: type,
      data: JSON.stringify(data),
      exchange_user: userId,
    },
  });

  return r;
}

async function _validateOrder(order) {
  // console.log("order! ", order);
  // 1. Listing Time < currentTime < expirationTime
  const now = Math.floor(new Date().getTime() / 1000);
  const isTimeValid = now > order.listingTime && now < order.expirationTime;
  if (!isTimeValid) {
    return { result: false, reason: "time is invalid" };
  }

  return { result: true };

  // 2. If the maker is still owner of the item
  //TODO: 여기서 확인을 해야하는 건지 확실하지 않음
}

async function getNftPrice(order, tokenId, contractAddress) {
  const basicCollections = order.basicCollections;
  const collections = order.collections;

  if (basicCollections) {
    for (let collection of basicCollections) {
      if (collection.nftAddress === contractAddress) {
        for (let item of collection.items) {
          if (item.nftId === tokenId) {
            return { result: true, price: item.erc20TokenAmount };
          } else {
            console.log("nono", item.nftId);
          }
        }
      } else {
        console.log("11", collection.nftAddress, contractAddress);
      }
    }
  } else {
    console.log("131");
  }

  if (collections) {
    for (let collection of collections) {
      if (collection.nftAddress === contractAddress) {
        for (let item of collection.items) {
          if (item.nftId === tokenId) {
            return { result: true, price: item.erc20TokenAmount };
          }
        }
      }
    }
  }

  return { result: false, reason: "not found" };
}
