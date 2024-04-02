const dayjs = require("dayjs");
const { NFT_TRADE_LOG_TYPE } = require("../utils/constants");

const listingAndSaleUpdate = async ({ strapi }) => {
  let listings = [];
  let sales = [];
  let transfers = [];

  const userObject = {};

  const collectionData = await strapi.db
    .query("api::collection.collection")
    .findMany({
      where: {
        publishedAt: {
          $notNull: true,
        },
      },
      orderBy: {
        volume_24h: "desc",
      },
    });

  const uniqueFromAndTo = new Set(
    collectionData.flatMap((item) => [item.from, item.to])
  );

  for (const address of uniqueFromAndTo) {
    userObject[address] = {
      total_sale: 0,
      total_listing: 0,
    };
  }

  const topListing = collectionData.slice(0, 10);

  for (let i of topListing) {
    console.log(i);
  }

  const allLogs = await strapi.entityService.findMany(
    "api::nft-trade-log.nft-trade-log",
    {
      where: {
        from: {
          $notNull: true,
        },
      },
      populate: {
        nft: {
          populate: {
            collection: true,
          },
        },
      },
    }
  );

  allLogs.forEach((item) => {
    if (item.type === NFT_TRADE_LOG_TYPE.SALE) {
      sales.push(item);
    } else if (item.type === NFT_TRADE_LOG_TYPE.LISTING) {
      listings.push(item);
    } else if (item.type === NFT_TRADE_LOG_TYPE.TRANSFER) {
      transfers.push(item);
    }
  });

  console.log(sales[0]);
  console.log(listings[0]);
  console.log(transfers[0]);

  // 1. Listing 계산
  sales.forEach((item) => {});
  // 1-1. 컬렉션이 10위안에 든 것.

  // 1-2. 컬렉션이 10위안에 안 든 것
};

module.exports = {
  listingAndSaleUpdate,
};
