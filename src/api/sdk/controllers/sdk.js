"use strict";

const { createOrderData, createOrdersData } = require("./dataEncoder.js");
const {
  getNFTOwner,
  weiToEther,
  getERC20Balance,
} = require("./blockchainHelper.js");
const dayjs = require("dayjs");
const {
  batchUpdateFloorPrice,
} = require("../../../listener/collectionStats.js");

const {
  updateListingPoint,
} = require("../../../utils/airdropPrePointHelper.js");

/**
 * A set of functions called "actions" for `sdk`
 */

const SUCCESS_RESPONSE = 0;
const ERROR_RESPONSE = 1234;

// GENERAL

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_PAGE_SIZE = 40;

// TODO: TESTNET
const WENETH_ADDRESS = "0x289Da9DE60f270c743848d287DDabA807C2c4722";
// TODO: TESTNET
const WENETH_TOKEN_ID = 6;

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
  postBuyOrder: async (ctx, next) => {
    try {
      const data = ctx.request.body.data;
      console.log("post order ", data);
      // 1. check if the user exist.
      // contractAddress 로 값을 찾아온다.
      const user = await strapi.entityService.findMany(
        "api::exchange-user.exchange-user",
        {
          filters: {
            address: {
              $eqi: data.maker,
            },
          },
        }
      );
      if (user.length != 1) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `address ${data.maker} doesn't exist on db`,
        };
        return;
      }

      // 2. Check if the collection exist.
      const collection = await strapi.db
        .query("api::collection.collection")
        .findOne({
          where: {
            contract_address: data.metadata.asset.address,
          },
        });

      if (collection == null) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `contract ${data.metadata.asset.address} doesn't basePrice on collection table`,
        };
        return;
      }

      //

      // 3. Check if the user has more wenETH than the base price.
      // Base price 는 fee를 뺀 금액
      // totalERC20Amount 는 fee를 더한 금액
      const totalERC20Amount = BigInt(data.totalERC20Amount);
      const wenETHBalance = await getERC20Balance(WENETH_ADDRESS, data.maker);
      console.log(
        totalERC20Amount,
        wenETHBalance,
        wenETHBalance - totalERC20Amount
      );

      if (wenETHBalance - totalERC20Amount < 0) {
        ctx.body = {
          code: ERROR_RESPONSE,
          msg: `address ${data.maker} doesn't have enough wenETH to place a bid`,
        };
        return;
      }

      // 4. Create Batch Order
      const single_price = (
        totalERC20Amount / BigInt(data.quantity)
      ).toString();
      const single_price_in_eth = weiToEther(
        totalERC20Amount / BigInt(data.quantity)
      );
      let orderUuid = createUuidv4();
      let batchOrderObject = {
        order_id: orderUuid,
        maker: data.maker,
        taker: data.taker,
        listing_time: data.listingTime,
        expiration_time: data.expirationTime,
        collection: collection.id,
        total_quantity: data.quantity,
        total_price: totalERC20Amount.toString(),
        total_price_in_eth: weiToEther(totalERC20Amount.toString()),
        single_price,
        single_price_in_eth,
      };
      const batchOrder = await strapi.entityService.create(
        "api::batch-buy-order.batch-buy-order",
        {
          data: batchOrderObject,
        }
      );

      console.log("batch order! ", batchOrder);

      let createdOrderIds = [];
      for (let i = 0; i < data.quantity; i++) {
        const exchangeDataObject = {
          order: {
            maker: data.maker,
            taker: data.taker,
            expiry: data.expiry,
            nonce: data.nonce,
            erc20Token: data.paymentToken,
            erc20TokenAmount: data.basePrice,
            fees: data.fees,
            nft: data.metadata.asset.address,
            nftId: data.metadata.asset.id,
            nftProperties: data.properties,
            hashNonce: data.hashNonce,
          },
          signature: {
            signatureType: 0,
            v: data.v,
            r: data.r,
            s: data.s,
          },
          extraData: "",
        };

        //5. Create Orders by the quantity.
        const order = await strapi.entityService.create(
          "api::buy-order.buy-order",
          {
            data: {
              schema: data.metadata.schema,
              token_id: data.metadata.asset.id,
              quantity: 1,
              order_hash: data.hash,
              collection: collection.id,
              sale_kind: data.saleKind,
              side: data.side,
              maker: data.maker,
              taker: data.taker,
              base_price: data.basePrice.toString(),
              total_price: totalERC20Amount.toString(),
              total_price_in_eth: weiToEther(totalERC20Amount.toString()),
              single_price,
              single_price_in_eth,
              expiration_time: data.expirationTime,
              listing_time: data.listingTime,
              batch_buy_order: batchOrder.id,
              contract_address: data.metadata.asset.address,
              token: WENETH_TOKEN_ID,
              nonce: data.nonce,
              hash_nonce: data.hashNonce,
              standard: WEN_STANDARD,
              exchange_data: JSON.stringify(exchangeDataObject),
            },
          }
        );
        createdOrderIds.push(order.id);
      }

      console.log("buy orders has created: ", createdOrderIds);

      ctx.body = {
        data: { batchOrderObject, createdOrderIds },
        code: SUCCESS_RESPONSE,
      };
      return;

      // const userWenETHBalance =
      /**
       * post order  {
  exchange: '0xd75104c9c2aec1594944c8f3a2858c62deeae91b',
  maker: '0xe0c78c90e25165cf8707ece8664916d1ea0b7994',
  taker: '0x0000000000000000000000000000000000000000',
  side: 0,
  saleKind: 8,
  paymentToken: '0x289da9de60f270c743848d287ddaba807c2c4722',
  quantity: '2',
  basePrice: '20000000000000000',
  extra: '2',
  listingTime: 1712853721,
  expirationTime: 1713458581,
  metadata: {
    asset: { id: '0', address: '0x0bf4a65d89ed719827e825fa7a130095da9fd68c' },
    schema: 'ERC721'
  },
  fees: [
    {
      recipient: '0x02d50300dad0b3f35540e593e508fad312786292',
      amount: '1000000000000000',
      feeData: '0x'
    },
    {
      recipient: '0xfb6fb1c53943d6797add7e4228c44c909e993023',
      amount: '600000000000000',
      feeData: '0x'
    }
  ],
  nonce: '15',
  hashNonce: '0',
  hash: '0xd4469d6b9b0681046617e251e355e3870ebb7a7c2b33a0272af0135455dd75f6',
  signatureType: 0,
  v: 27,
  r: '0xeb579f755c893af271c640631d993686c6003261d2044099e8cc7f98a63935bb',
  s: '0x77256d27ad58f235c5b4f0c6f28b1b80664cab755b8f131838cf87fca695ad14',
  chain: 'wen',
  properties: [
    {
      propertyValidator: '0x0000000000000000000000000000000000000000',
      propertyData: '0x'
    }
  ]
       */

      // { ExchangeData
      //   order: {
      //     maker: '0xb4752134bfacf63a918df8fabe65abf00cffff00',
      //     taker: '0x0000000000000000000000000000000000000000',
      //     expiry: '0x8000000000000000000000000000000000000000000000036614d7c3661e127a',
      //     nonce: '6',
      //     erc20Token: '0x4300000000000000000000000000000000000004',
      //     erc20TokenAmount: '1116000000000000',
      //     fees: [ [Object], [Object] ],
      //     nft: '0x41951c1a94d068e1da124f63d5e99ee2a0acdaac',
      //     nftId: '0',
      //     nftProperties: [ [Object] ],
      //     hashNonce: '0'
      //   },
      //   signature: {
      //     signatureType: 0,
      //     v: 27,
      //     r: '0x9f69c62cf8cdc75b31564bcf89349405011d399931187652f2833ae01320a55f',
      //     s: '0x66168f958fb95c48e5383e220cb9bea3e0030c78bc4d45caff7c4940c25e6405'
      //   },
      //   extraData: ''
      // }
      // const exchangeDataObject = {
      //   basicCollections: data.basicCollections,
      //   collections: data.collections,
      //   startNonce: data.startNonce,
      //   hashNonce: data.hashNonce,
      //   platformFeeRecipient: data.platformFeeRecipient,
      //   v: data.v,
      //   r: data.r,
      //   s: data.s,
      //   listingTime: data.listingTime,
      //   expirationTime: data.expirationTime,
      //   maker: data.maker,
      //   hash: data.hash,
      //   paymentToken: data.paymentToken,
      //   signatureType: SIGNATURE_TYPE_EIP712,
      // };
    } catch (error) {}
  },

  getOrdersNonce: async (ctx, next) => {
    try {
      const { maker, schema, count } = ctx.request.query;
      console.log("getOrderNonce : ", maker, schema, count);

      let makerNonce;
      const uuid = createUuidv4();

      // 1. 현재 maker 의 nonce 값을 가져온다.
      const r = await strapi.entityService.findMany(
        "api::exchange-user.exchange-user",
        {
          filters: {
            address: {
              $eqi: maker,
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
          r[0].id,
          {}
        );
      } else {
        console.log("t", "no");
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
                $eqi: item.contractAddress,
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
              $eqi: data.maker,
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
                  $eqi: item.nftAddress,
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
                  $eqi: item.nftAddress,
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

      // Combine the results from basicCollections and collections
      const combinedResults = [...basicCollectionsResult, ...collectionsResult];
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
        r[0].id,
        data
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
              $eqi: data.buyer,
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
                  $eqi: item.contractAddress,
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
        userData[0].id,
        {}
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
        id: result.id,
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
      await checkIfUserExist(data.buyer.toLowerCase());
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

  fetchBatchBuyExchangeDataByHash: async (ctx, next) => {
    const data = ctx.request.body.data;

    const hashListWithNonce = [];
    const orderList = [];

    // 1. get order data with orderHash
    for (let order of data.hashList) {
      const orderData = await strapi.db
        .query("api::buy-order.buy-order")
        .findOne({
          where: {
            $and: [
              { order_hash: order.orderHash },
              { is_hidden: false },
              { is_sold: false },
            ],
          },
          populate: {
            collection: true,
            token: true,
            batch_buy_order: true,
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
          is_hidden: orderData.is_hidden,
          is_sold: orderData.is_sold,
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
    throw new Error();
  }
}

async function createRequestLog(uuid, type, data, userId, post_batch_data) {
  // 3. request log 를 찍는다.
  const r = await strapi.entityService.create("api::request-log.request-log", {
    data: {
      request_uuid: uuid,
      type: type,
      data: JSON.stringify(data),
      exchange_user: userId,
      post_batch_data,
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
      royalty_fee_receiver: collection.royaltyFeeRecipient,
      royalty_fee_point: collection.royaltyFee,
      protocol_fee_receiver: exchangeDataObject.platformFeeRecipient,
      protocol_fee_point: collection.platformFee,
    },
  });

  const expirationTime = new Date(data.expirationTime * 1000).toISOString();

  let result = await strapi.entityService.create(
    "api::nft-trade-log.nft-trade-log",
    {
      data: {
        type: LOG_TYPE_LISTING,
        price: weiToEther(item.erc20TokenAmount.toString()),
        from: data.maker,
        nft: nftData.id,
        expired_at: expirationTime,
        timestamp: dayjs().unix(),
      },
    }
  );

  await updateListingPoint(
    false,
    makerAddress,
    collection.nftAddress,
    item.nftId,
    weiToEther(item.erc20TokenAmount.toString()),
    result.id,
    { strapi }
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
