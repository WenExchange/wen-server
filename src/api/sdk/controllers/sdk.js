"use strict";

const { createOrderData, createOrdersData } = require("./dataEncoder.js");
const { getNFTOwner, weiToEther } = require("./blockchainHelper.js");
const dayjs = require("dayjs");
const {
  batchUpdateFloorPrice,
} = require("../../../listener/collectionStats.js");

/**
 * A set of functions called "actions" for `sdk`
 */

const SUCCESS_RESPONSE = 0;
const ERROR_RESPONSE = 1234;

// GENERAL

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_PAGE_SIZE = 40;

//From SDK
const SIGNATURE_TYPE_EIP712 = 0;
const SIGNATURE_TYPE_PRESIGNED = 1;
const SALEKIND_BatchSignedERC721Order = 3;
const SALEKIND_ContractOffer = 7;
const ORDERSIDE_BUY = 0;
const ORDERSIDE_SELL = 1;

//From Wen
const WEN_STANDARD = "wen-ex-v1";
// TODO: NEED TO CHAGNE TO REAL ADDRESS
const CONTRACT_ADDRESS_WEN_EX = "0x5958dC6cdc5df14b92699eABf17c7a19A1B22712";
const LOG_TYPE_SALE = "SALE";
const LOG_TYPE_TRANSFER = "TRANSFER";
const LOG_TYPE_LISTING = "LISTING";
const LOG_TYPE_OFFER = "OFFER";
const LOG_TYPE_COLLECTION_OFFER = "COLLECTION_OFFER";
const LOG_TYPE_CANCEL_LISTING = "CANCEL_LISTING";
const LOG_TYPE_CANCEL_OFFER = "CANCEL_OFFER";

const TOKEN_ETH_ID = 1;
const TOKEN_WENETH_ID = 2; //TODO: WEN ETH TOKEN 에 추가하고 변경

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
      // console.log("getOrderNonce : ", maker, schema, count);

      let makerNonce;
      const uuid = createUuidv4();

      // 1. 현재 maker 의 nonce 값을 가져온다.
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

  // TODO: 이 함수는 sell order만 처리
  postOrderBatch: async (ctx, next) => {
    try {
      const data = ctx.request.body.data;
      console.log("post order ", data);

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

      // 3. Check if sender owns the NFT
      if (data.basicCollections) {
        for (let collection of data.basicCollections) {
          for (let item of collection.items) {
            {
              let nftOwner = await getNFTOwner(
                collection.nftAddress,
                item.nftId
              );
              if (nftOwner.toLowerCase() != data.maker.toLowerCase()) {
                ctx.body = {
                  code: ERROR_RESPONSE,
                  msg: `${data.maker} is not owner of ${collection.nftAddress} item id ${item.nftId}`,
                };
                return;
              }
            }
          }
        }
      }
      if (data.collections) {
        for (let collection of data.collections) {
          for (let item of collection.items) {
            {
              let nftOwner = await getNFTOwner(
                collection.nftAddress,
                item.nftId
              );
              if (nftOwner.toLowerCase() != data.maker.toLowerCase()) {
                ctx.body = {
                  code: ERROR_RESPONSE,
                  msg: `${data.maker} is not owner of ${collection.nftAddress} item id ${item.nftId}`,
                };
                return;
              }
            }
          }
        }
      }

      // 4. Get Total Item Count (Order Count)
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

      let orderIndex = data.startNonce;
      const basicCollectionsData = processCollections(
        data.basicCollections || [],
        collectionIdMap,
        exchangeDataObject,
        r[0].address,
        data,
        orderIndex,
        SCHEMA_ERC721
      );

      // Note: You should await the promise before proceeding
      const basicCollectionsResult = await basicCollectionsData.promise;

      // Calculate the starting order index for the next set of collections
      const collectionsStartOrderIndex =
        orderIndex + basicCollectionsData.totalCount;
      const collectionsData = processCollections(
        data.collections || [],
        collectionIdMap,
        exchangeDataObject,
        r[0].address,
        data,
        collectionsStartOrderIndex,
        SCHEMA_ERC721
      );

      // Await the collections processing results
      const collectionsResult = await collectionsData.promise;
      console.log(333, "collectionsResult", collectionsResult);
     

      // Combine the results from basicCollections and collections
      const combinedResults = [...basicCollectionsResult, ...collectionsResult];
      console.log(333, "combinedResults", combinedResults);
      // Update Here - Update 는 Deadlock 문제때문에 따라
      for (let item of combinedResults) {
        if (!item.error) {
          await strapi.entityService.update("api::nft.nft", item.nftId, {
            data: { sell_order: item.orderEntityId },
          });
        }
      }

      const uniqueAddresses = combinedResults.reduce((acc, current) => {
        acc.add(current.assetContract);
        return acc;
      }, new Set());

      // Convert the Set back to an array
      const uniqueContractAddress = Array.from(uniqueAddresses);
      console.log(333, "uniqueContractAddress",uniqueContractAddress);
      batchUpdateFloorPrice({
        strapi,
        addressList: uniqueContractAddress,
      }).catch((error) => {
        console.log("batchUpdateFloorPrice", error.message);
      });


      // Filter out the success and failure based on the error key
      const successList = combinedResults.filter((result) => !result.error);
      const failList = combinedResults.filter((result) => result.error);
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
      console.log(err);
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
            populate: { collection: true },
          });
          if (r.length === 0) {
            ctx.body = {
              code: ERROR_RESPONSE,
              msg: `No order for ${item.contractAddress} token_id : ${item.tokenId}`,
            };
            return;
          }
          const orderObj = JSON.parse(r[0].exchange_data);
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
            orderHash: getPlaneHash(orderObj.hash),
            quantity: 1, // TODO ERC 1155
            tokenContract: token,
            schema: SCHEMA_ERC721,
            buyer: data.buyer,
            toAddress: orderObj.maker,
            exchangeData: r[0].exchange_data,
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
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: error.msg,
      };
      return;
    }
  },

  getOrdersList: async (ctx, next) => {
    let {
      asset_contract_address,
      token_ids,
      sale_kind,
      side,
      maker,
      taker,
      payment_token,
      order_by,
      direction,
      listed_before,
      listed_after,
      page,
    } = ctx.request.query;

    let tokenList;
    if (token_ids) {
      const parts = token_ids.split(",");
      // 배열의 각 요소를 숫자로 변환
      const numbers = parts.map(Number);
      tokenList = numbers;
    }

    if (asset_contract_address == null || asset_contract_address == undefined) {
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: `asset_contract_address is not defined in query.`,
      };
      return;
    }

    if (page == null || page == undefined) {
      page = 1;
    }
    if (order_by == null || order_by == undefined) {
      order_by = "price";
    }

    if (direction == null || direction == undefined) {
      direction = "desc";
    }
    //query list
    let andQueryList = [];

    // query 객체의 각 속성에 대해 루프
    for (const [key, value] of Object.entries(ctx.request.query)) {
      if (value !== null && value !== undefined) {
        // 해당 속성이 비어있지 않다면 배열에 추가
        const queryObject = {};
        if (key === "asset_contract_address") {
          queryObject["contract_address"] = value;
        } else if (key === "listed_before") {
          queryObject["createdAt"] = { $lt: value };
        } else if (key === "listed_after") {
          queryObject["createdAt"] = { $gt: value };
        } else if (
          key === "chain" ||
          key === "order_by" ||
          key === "direction" ||
          key === "token_ids"
        ) {
          // 이 경우에는 key 추가 x
        } else {
          queryObject[key] = value;
        }
        andQueryList.push(queryObject);
      }
    }
    let orQueryList = [];
    if (tokenList) {
      for (let tokenId of tokenList) {
        const queryObject = { token_id: tokenId };
        orQueryList.push(queryObject);
      }
    }

    //isValid = true 인 order만
    andQueryList.push({ is_valid: true });
    const order = {};
    order[order_by] = direction;
    let r;
    if (orQueryList.length == 0) {
      r = await strapi.db.query("api::order.order").findPage({
        where: { $and: andQueryList },
        pageSize: DEFAULT_PAGE_SIZE,
        page: page,
        orderBy: [order],
      });
    } else {
      r = await strapi.db.query("api::order.order").findPage({
        where: { $and: andQueryList, $or: orQueryList },
        pageSize: DEFAULT_PAGE_SIZE,
        page: page,
        orderBy: [order],
        populate: { token: true },
      });
    }

    const results = r.results;
    const orderList = [];

    for (let result of results) {
      orderList.push({
        contractAddress: result.contract_address,
        // Asset token id
        tokenId: result.token_id,
        // Asset schema
        schema: result.schema,
        // The order trading Standards.
        standard: result.standard,
        // The order maker's wallet address.
        maker: result.maker,
        // Listing time.
        listingTime: result.listing_time,
        // Expiration time.
        expirationTime: result.expiration_time,
        // Priced in paymentToken, and the unit is wei.
        price: result.price,
        // The contract address of the paymentToken.
        paymentToken: result.token.address,
        // Kind of sell order. 0 for fixed-price sales, and 3 for batchSignedERC721 sell order.
        saleKind: result.sale_kind,
        // Side of the order. 0 for buy order, and 1 for sell order.
        side: result.side,
        // Order hash.
        orderHash: result.order_hash,
      });
    }

    ctx.body = {
      data: { orders: orderList },
      pagination: r.pagination,
      code: SUCCESS_RESPONSE,
    };
    return;
  },
  encodeTradeDataByHash: async (ctx, next) => {
    const data = ctx.request.body.data;
    // console.log("encode!!!!!! ", data);
    const hashListWithNonce = [];
    const orderList = [];

    for (let order of data.hashList) {
      hashListWithNonce.push(splitStringConditional(order.orderHash));
    }

    // 1. check if the sender is user
    try {
      checkIfUserExist(data.buyer.toLowerCase());
    } catch (error) {
      ctx.body = {
        code: ERROR_RESPONSE,
        msg: `${data.buyer} doesn't exist on db`,
      };
      return;
    }

    // 2. get order data with orderHash
    let txValue = BigInt(0);
    for (let order of data.hashList) {
      const r = await strapi.db.query("api::order.order").findOne({
        where: {
          order_hash: order.orderHash,
        },
        populate: {
          collection: true,
        },
      });
      if (r == null) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `order hash ${order.orderHash} doesn't exist on db`,
        };
        return;
      } else {
        orderList.push(r);
        txValue += BigInt(r.price);
      }
    }
    // check if this is FillBatchSignedOrder or FillBatchSignedOrders(from various Signined Order)
    let isOrder = true;
    let currenOrderHash;
    for (let order of orderList) {
      if (currenOrderHash) {
        if (currenOrderHash == getPlaneHash(order.order_hash)) {
          currenOrderHash = getPlaneHash(order.order_hash);
        } else {
          isOrder = false;
          break;
        }
      } else {
        currenOrderHash = getPlaneHash(order.order_hash);
      }
    }

    let txData;
    if (isOrder) {
      txData = createOrderData(orderList, data.buyer).parameterData;
    } else {
      txData = createOrdersData(orderList, data.buyer).parameterData;
    }

    ctx.body = {
      data: {
        to: CONTRACT_ADDRESS_WEN_EX,
        value: txValue.toString(),
        data: txData,
      },
      code: SUCCESS_RESPONSE,
    };

    return;
  },

  fetchExchangeDataByHash: async (ctx, next) => {
    const data = ctx.request.body.data;
    // console.log("encode!!!!!! ", data);

    const hashListWithNonce = [];
    const orderList = [];

    for (let order of data.hashList) {
      hashListWithNonce.push(splitStringConditional(order.orderHash));
    }

    // 1. get order data with orderHash
    for (let order of data.hashList) {
      const orderData = await strapi.db.query("api::order.order").findOne({
        where: {
          order_hash: order.orderHash,
        },
        populate: {
          collection: true,
          token: true,
        },
      });

      console.log("orderData   :   ", orderData);
      if (orderData == null) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `order hash ${order.orderHash} doesn't exist on db`,
        };
        return;
      } else {
        orderList.push({
          contractAddress: orderData.contract_address,
          tokenId: orderData.token_id,
          standard: orderData.standard,
          paymentToken: orderData.token.address,
          maker: orderData.maker,
          listingTime: orderData.listing_time,
          side: orderData.side,
          saleKind: orderData.sale_kind,
          price: orderData.price,
          isValid: true,
          errorDetail: "",
          taker: "0x0000000000000000000000000000000000000000",
          expirationTime: orderData.expiration_time,
          quantity: orderData.quantity,
          priceBase: orderData.price_eth,
          schema: orderData.schema,
          paymentTokenCoin: {
            id: orderData.token.token_id,
            name: orderData.token.symbol,
            address: orderData.token.address,
            icon: orderData.token.icon,
            decimal: orderData.token.decimal,
            accuracy: 4,
          },
          exchangeData: orderData.exchange_data,
          orderHash: orderData.order_hash,
          orderId: orderData.order_id,
        });
      }
    }

    ctx.body = {
      data: {
        orderExchangeList: orderList,
      },
      code: SUCCESS_RESPONSE,
    };
  },
};

async function getTokenData(symbol) {
  const r = await strapi.db.query("api::token.token").findOne({
    where: {
      symbol: symbol,
    },
  });
  return r;
}

async function checkIfUserExist(userAddress) {
  const r = await strapi.db.query("api::exchange-user.exchange-user").findOne({
    where: {
      address: userAddress,
    },
  });

  console.log(userAddress);
  if (r == null) {
    throw Error();
  }
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

function splitStringConditional(inputString) {
  // '_'를 포함하는지 확인
  if (inputString.includes("_")) {
    // '_'를 기준으로 분리
    const [data, numberPart] = inputString.split("_");
    // 분리된 데이터와 숫자를 객체로 반환
    return {
      data,
      number: parseInt(numberPart, 10), // 숫자로 변환
    };
  } else {
    // '_'가 없는 경우 원래 문자열과 함께 null을 반환
    return {
      data: inputString,
      number: null,
    };
  }
}

async function processItem(
  collection,
  item,
  collectionIdMap,
  exchangeDataObject,
  makerAddress,
  data,
  orderIndex,
  schema_type
) {
  let orderUuid = createUuidv4();
  // Query if the NFT exists
  const nftData = await strapi.db.query("api::nft.nft").findOne({
    where: {
      token_id: item.nftId,
      collection: { contract_address: collection.nftAddress },
    },
    populate: {
      sell_order: true,
    },
  });
  if (!nftData) {
    throw new Error(
      `${collection.nftAddress} item id ${item.nftId} doesn't exist on DB`
    );
  }
  if (nftData.sell_order != null) {
    if (nftData.sell_order.expiration_time < Date.now() / 1000) {
      await strapi.entityService.delete(
        "api::order.order",
        nftData.sell_order.id
      );
    } else {
      console.log("no sell_order error", nftData.sell_order);

      throw new Error(
        `${collection.nftAddress} item id ${item.nftId} already has a sell order. Please cancel the previous sell order first.`
      );
    }
  }
  exchangeDataObject.nonce = orderIndex;
  const order = await strapi.entityService.create("api::order.order", {
    data: {
      order_id: orderUuid,
      schema: schema_type,
      price: item.erc20TokenAmount,
      price_eth: weiToEther(item.erc20TokenAmount),
      token_id: item.nftId,
      quantity: 1,
      order_hash: data.hash + "_" + orderIndex,
      nonce: orderIndex,
      collection: collectionIdMap[collection.nftAddress],
      contract_address: collection.nftAddress,
      sale_kind: SALEKIND_BatchSignedERC721Order,
      maker: makerAddress,
      side: ORDERSIDE_SELL,
      listing_time: data.listingTime.toString(),
      expiration_time: data.expirationTime.toString(),
      standard: WEN_STANDARD,
      nft: nftData.id,
      token: TOKEN_ETH_ID, //TODO
      exchange_data: JSON.stringify(exchangeDataObject),
    },
  });

  const expirationTime = new Date(data.expirationTime * 1000).toISOString();

  let result = await strapi.entityService.create(
    "api::nft-trade-log.nft-trade-log",
    {
      data: {
        type: LOG_TYPE_LISTING,
        price: item.erc20TokenAmount,
        from: data.maker,
        nft: nftData.id,
        expired_at: expirationTime,
        timestamp: dayjs().unix(),
      },
    }
  );
  return {
    error: false,
    assetContract: collection.nftAddress,
    assetTokenId: item.nftId,
    orderId: orderUuid,
    orderEntityId: order.id,
    nftId: nftData.id,
  };
}

function processCollections(
  collections,
  collectionIdMap,
  batchSignedOrder,
  makerAddress,
  data,
  orderIndex,
  schema_type
) {
  let operations = [];
  let currentOrderIndex = orderIndex;
  let itemCount = 0;
  for (let collection of collections) {
    for (let item of collection.items) {
      itemCount++;
      operations.push(
        processItem(
          collection,
          item,
          collectionIdMap,
          batchSignedOrder,
          makerAddress,
          data,
          currentOrderIndex++,
          schema_type
        ).catch((error) => {
          return {
            error: true,
            assetContract: collection.nftAddress,
            assetTokenId: item.nftId,
            errorDetails: error.message,
            nftId: null,
            orderEntityId: null,
          };
        })
      );
    }
  }
  return { promise: Promise.all(operations), totalCount: itemCount };
}

function getPlaneHash(orderHash) {
  return orderHash.split("_")[0];
}
