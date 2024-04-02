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

  const topListing = collectionData.slice(0, 10);
  const topListingAddresses = topListing.map((listing) =>
    listing.contract_address.toLowerCase()
  );

  //   for (let i of topListing) {
  //     console.log(i);
  //   }

  let allLogs = await strapi.entityService.findMany(
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

  const uniqueFromAndTo = new Set(
    allLogs
      .flatMap((item) => [
        item.from ? item.from.toLowerCase() : null,
        item.to ? item.to.toLowerCase() : null,
      ])
      .filter(Boolean) // null 값 제거
  );

  //   console.log("uniqueFromAndTo", uniqueFromAndTo);

  for (const address of uniqueFromAndTo) {
    userObject[address] = {
      total_sale: 0,
      total_listing: 0,
    };
  }

  allLogs.forEach((item) => {
    if (item.type === NFT_TRADE_LOG_TYPE.SALE) {
      sales.push(item);
    } else if (item.type === NFT_TRADE_LOG_TYPE.LISTING) {
      listings.push(item);
    } else if (item.type === NFT_TRADE_LOG_TYPE.TRANSFER) {
      transfers.push(item);
    }
  });

  let totalIncludedListing = 0;
  let totalIncludedListingPointSum = 0;
  let totalNotIncludedListing = 0;
  let totalNotIncludedListingPointSum = 0;

  // 1. Listing 계산
  console.log("Listing 계산 start");
  listings.forEach((item) => {
    const itemAddress = item.nft.collection.contract_address.toLowerCase();
    const fromAddress = item.from.toLowerCase();
    if (topListingAddresses.includes(itemAddress)) {
      // topListingAddresses에 포함된 경우의 처리
      const point = 500;
      userObject[fromAddress].total_listing += point;
      totalIncludedListingPointSum += point;
      totalIncludedListing++;
    } else {
      // topListingAddresses에 포함되지 않은 경우의 처리
      const point = 30;
      userObject[fromAddress].total_listing += point;
      totalNotIncludedListingPointSum += point;
      totalNotIncludedListing++;
    }
  });
  console.log(
    "totalIncludedListing",
    totalIncludedListing,
    "totalIncludedListingPointSum",
    totalIncludedListingPointSum,
    "totalNotIncludedListingPointSum",
    totalNotIncludedListingPointSum,
    "totalNotIncludedListing",
    totalNotIncludedListing
  );

  let totalIncludedSale = 0;
  let totalIncludedSalePointSum = 0;
  let totalNotIncludedSale = 0;
  let totalNotIncludedSalePointSum = 0;
  // 2. Sale 계산
  console.log("Sale 계산 start");

  sales.forEach((item) => {
    const itemAddress = item.nft.collection.contract_address.toLowerCase();
    const fromAddress = item.from.toLowerCase();
    const toAddress = item.to.toLowerCase();

    if (topListingAddresses.includes(itemAddress)) {
      // topListingAddresses에 포함된 경우의 처리
      const fromPoint = item.price * 3000;
      const toPoint = item.price * 4000;

      userObject[fromAddress].total_sale += fromPoint;
      userObject[toAddress].total_sale += toPoint;

      totalIncludedSalePointSum += toPoint + fromPoint;
      totalIncludedSale++;
    } else {
      // topListingAddresses에 포함되지 않은 경우의 처리
      const fromPoint = item.price * 3000;
      const toPoint = item.price * 4000;

      userObject[fromAddress].total_sale += fromPoint;
      userObject[toAddress].total_sale += toPoint;

      totalNotIncludedSalePointSum += toPoint + fromPoint;
      totalNotIncludedSale++;
    }
  });

  console.log(
    "totalIncludedSale",
    totalIncludedSale,
    "totalIncludedSalePointSum",
    totalIncludedSalePointSum,
    "totalNotIncludedSalePointSum",
    totalNotIncludedSalePointSum,
    "totalNotIncludedSale",
    totalNotIncludedSale
  );

  let totalIncludedTransfer = 0;
  let totalIncludedTransferPointSum = 0;
  let totalNotIncludedTransfer = 0;
  let totalNotIncludedTransferPointSum = 0;

  // 3. Transfer 계산
  console.log("Transfer 계산 start");

  transfers.forEach((item) => {
    if (item.nft) {
      const itemAddress = item.nft.collection.contract_address.toLowerCase();
      const fromAddress = item.from.toLowerCase();
      const toAddress = item.to.toLowerCase();

      if (topListingAddresses.includes(itemAddress)) {
        // topListingAddresses에 포함된 경우의 처리
        const fromPoint = 20;
        const toPoint = 20;

        userObject[fromAddress].total_sale += fromPoint;
        userObject[toAddress].total_sale += toPoint;

        totalIncludedTransferPointSum += toPoint + fromPoint;
        totalIncludedTransfer++;
      } else {
        // topListingAddresses에 포함되지 않은 경우의 처리
        const fromPoint = 5;
        const toPoint = 5;

        userObject[fromAddress].total_sale += fromPoint;
        userObject[toAddress].total_sale += toPoint;

        totalNotIncludedTransferPointSum += toPoint + fromPoint;
        totalNotIncludedTransfer++;
      }
    }
  });
  console.log(
    "totalIncludedTransfer",
    totalIncludedTransfer,
    "totalIncludedTransferPointSum",
    totalIncludedTransferPointSum,
    "totalNotIncludedTransferPointSum",
    totalNotIncludedTransferPointSum,
    "totalNotIncludedTransfer",
    totalNotIncludedTransfer
  );

  // 4. 전체 유저 스탯 계산.
  console.log("전체 유저 스탯계산 start");

  const totalDistributed =
    totalIncludedListingPointSum +
    totalIncludedSalePointSum +
    totalIncludedTransferPointSum +
    totalNotIncludedListingPointSum +
    totalNotIncludedSalePointSum +
    totalNotIncludedTransferPointSum;

  console.log("totalDistributed", totalDistributed);

  // 4-1. 가장 최근 airdrop stat을 가져온다.
  const airdropStat = await strapi.db
    .query("api::airdrop-distribution-stat.airdrop-distribution-stat")
    .findOne({
      orderBy: {
        snapshot_id: "desc",
      },
    });

  let snapshotId = 0;
  if (airdropStat) {
    snapshotId = parseInt(airdropStat.snapshot_id) + 1;
  }

  const currentTs = dayjs().unix();
  // 4-2. 모든 유저에 대해서 airdrop stat log와 exchange user 업데이트
  for (const key in userObject) {
    if (Object.hasOwnProperty.call(userObject, key)) {
      const userData = userObject[key];
      const userDbData = await strapi.db
        .query("api::exchange-user.exchange-user")
        .findOne({
          where: {
            address: key,
          },
        });

      if (
        (userData.total_sale != 0 || userData.total_listing != 0) &&
        userDbData
      ) {
        // 1. Airdrop Stat Log 추가
        await strapi.entityService.create(
          "api::airdrop-stat-log.airdrop-stat-log",
          {
            data: {
              sale_point_24h: userData.total_sale,
              listing_point_24h: userData.total_listing,
              bidding_point_24h: 0,
              extra_point_24h: 0,
              exchange_user: userDbData.id,
              timestamp: currentTs,
              total_trade_point: userData.total_sale + userData.total_listing,
              total_airdrop_point: userData.total_sale + userData.total_listing,
              snapshot_id: snapshotId,
            },
          }
        );
        // 2. Exchange User Total Point 추가
        await strapi.entityService.update(
          "api::exchange-user.exchange-user",
          key,
          {
            data: {
              total_airdrop_point: userData.total_sale + userData.total_listing,
            },
          }
        );
      }
    }
  }

  // 4-3. airdrop-distribution-stat 업데이트
  console.log("airdrop-distribution-stat start");

  await strapi.entityService.create(
    "api::airdrop-distribution-stat.airdrop-distribution-stat",
    {
      data: {
        distributed_listing_point:
          totalIncludedListingPointSum + totalNotIncludedListingPointSum,
        distributed_bidding_point: 0,
        distributed_sale_point:
          totalIncludedSalePointSum +
          totalNotIncludedSalePointSum +
          totalIncludedTransferPointSum +
          totalNotIncludedTransferPointSum,
        distributed_extra_point: 0,
        timestamp: dayjs().unix(),
        snapshot_id: snapshotId,
      },
    }
  );
  console.log("distribution stat", {
    distributed_listing_point:
      totalIncludedListingPointSum + totalNotIncludedListingPointSum,
    distributed_bidding_point: 0,
    distributed_sale_point:
      totalIncludedSalePointSum +
      totalNotIncludedSalePointSum +
      totalIncludedTransferPointSum +
      totalNotIncludedTransferPointSum,
    distributed_extra_point: 0,
    timestamp: dayjs().unix(),
    snapshot_id: snapshotId,
  });
};

module.exports = {
  listingAndSaleUpdate,
};
