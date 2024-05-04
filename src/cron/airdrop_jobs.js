const dayjs = require("dayjs");

const EXCHANGE_VOLUME_MULTIPLIER = 0;

const { ethers } = require("ethers");
const { jsonRpcProvider_cron, AIRDROP_TYPE } = require("../utils/constants");
const DiscordManager = require("../discord/DiscordManager");
const updateCollectionAirdrop = async ({ strapi }) => {
  //  TOP 11-20 : 1.5x
  //  TOP 4-10 : 2x
  //  TOP 1-3 : 4x

  // 1. Get All Collection by volume_24h
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

  for (let i = 0; i < 3; i++) {
    await strapi.entityService.update(
      "api::collection.collection",
      collectionData[i].id,
      {
        data: {
          airdrop_multiplier: 4,
        },
      }
    );
  }

  for (let i = 3; i < 10; i++) {
    await strapi.entityService.update(
      "api::collection.collection",
      collectionData[i].id,
      {
        data: {
          airdrop_multiplier: 2,
        },
      }
    );
  }

  for (let i = 10; i < 20; i++) {
    await strapi.entityService.update(
      "api::collection.collection",
      collectionData[i].id,
      {
        data: {
          airdrop_multiplier: 1.5,
        },
      }
    );
  }

  for (let i = 20; i < collectionData.length; i++) {
    const collection = collectionData[i];
    if (collection.airdrop_multiplier != 1) {
      await strapi.entityService.update(
        "api::collection.collection",
        collection.id,
        {
          data: {
            airdrop_multiplier: 1,
          },
        }
      );
    }
  }
};

const updateUserMultiplier = async ({ strapi }) => {
  // createAirdropStat을 하고 나서 update 해주면 된다.

  const airdropStat = await strapi.db
    .query("api::airdrop-distribution-stat.airdrop-distribution-stat")
    .findOne({ orderBy: { snapshot_id: "desc" } });
  let snapshotId = 0;
  if (airdropStat) {
    snapshotId = parseInt(airdropStat.snapshot_id);
  } else {
    return;
  }

  const pastList = await strapi.db
    .query("api::exchange-user.exchange-user")
    .findMany({
      where: {
        $not: { airdrop_multiplier: 1 },
      },
    });

  for (let user of pastList) {
    console.log("user id : ", user.id, user.airdrop_multiplier);
    await strapi.entityService.update(
      "api::exchange-user.exchange-user",
      user.id,
      {
        data: {
          airdrop_multiplier: 1,
        },
      }
    );
  }

  // 2. Get 이번 스냅샷의 current user stat을 total_trade_point순으로 가져온다.
  const userList = await strapi.db
    .query("api::airdrop-stat-log.airdrop-stat-log")
    .findMany({
      where: {
        snapshot_id: snapshotId,
      },
      orderBy: {
        total_trade_point: "desc",
      },
      populate: {
        exchange_user: true,
      },
    });

  const multipliers = {
    3: [],
    2.5: [],
    2: [],
    1.5: [],
    1.3: [],
  };

  // userList 는 이미 순위별로 정렬된 상태
  userList.forEach((user, index) => {
    const rank = index + 1; // 순위는 1부터 시작
    let multiplierKey;

    if (rank <= 10) {
      multiplierKey = "3";
    } else if (rank <= 30) {
      multiplierKey = "2.5";
    } else if (rank <= 60) {
      multiplierKey = "2";
    } else if (rank <= 100) {
      multiplierKey = "1.5";
    } else if (rank <= 200) {
      multiplierKey = "1.3";
    }

    // 해당 배수에 사용자의 exchange_user.id 추가
    if (multiplierKey && user.exchange_user) {
      multipliers[multiplierKey].push({
        exchange_user_id: user.exchange_user.id,
        total_trade_point: user.total_trade_point,
      });
    }
  });

  const keys = Object.keys(multipliers);

  // async 함수 내에서 작업을 수행해야 합니다.
  for (const key of keys) {
    const users = multipliers[key];
    for (const user of users) {
      try {
        // await를 사용한 비동기 작업
        await strapi.entityService.update(
          "api::exchange-user.exchange-user",
          user.exchange_user_id,
          {
            data: {
              airdrop_multiplier: key,
            },
          }
        );
      } catch (error) {
        console.error(
          `Error updating exchange_user_id: ${user.exchange_user_id}`,
          error
        );
      }
    }
  }

  // airdrop-distribution-stat 에 multiplier 데이터 저장
  await strapi.entityService.update(
    "api::airdrop-distribution-stat.airdrop-distribution-stat",
    airdropStat.id,
    {
      data: {
        user_multiplier_json: multipliers,
      },
    }
  );
};

const createAirdropStat = async ({ strapi }) => {
  let sales = [];
  let biddings = [];
  let listings = [];
  let extras = [];

  const userObject = {};

  // 1. Distribution point 지정
  const totalListingPoint = 1000000 * (1 + 0.2 * EXCHANGE_VOLUME_MULTIPLIER);
  const totalSalePoint = 1400000 * (1 + 0.2 * EXCHANGE_VOLUME_MULTIPLIER);
  const totalBiddingPoint = 1200000 * (1 + 0.2 * EXCHANGE_VOLUME_MULTIPLIER);

  // 2. 모든 Airdrop_history_log 를 가져옴 (isDistributed = false && isCancelled = false)
  const historyList = await strapi.db
    .query("api::airdrop-history-log.airdrop-history-log")
    .findMany({
      where: {
        $and: [
          { is_distributed: false },
          { $not: { type: "EARLY_ACCESS" } },
          {
            is_cancelled: false,
          },
        ],
      },
      populate: {
        exchange_user: true,
      },
    });

  console.log("History List Count : ", historyList.length);

  // [전처리 1] 각각 array로 분류

  historyList.forEach((item) => {
    if (item.type === AIRDROP_TYPE.SALE) {
      sales.push(item);
    } else if (item.type === AIRDROP_TYPE.BIDDING) {
      biddings.push(item);
    } else if (item.type === AIRDROP_TYPE.LISTING) {
      listings.push(item);
    } else {
      extras.push(item);
    }
  });
  // [전처리 2] 존재하는 유저를 찾음

  // 중복 제거를 위해 Set을 사용하여 유일한 exchange_user id를 추출
  const uniqueIds = new Set(historyList.map((item) => item.exchange_user.id));
  // 중복되지 않은 각 exchange_user id에 대해 객체를 생성
  for (const id of uniqueIds) {
    const userItem = historyList.find((item) => item.exchange_user.id === id);
    const userAirdropMultiplier = userItem.exchange_user.airdrop_multiplier;
    const userAddress = userItem.exchange_user.address;
    const originalTotalAirdropPoint =
      userItem.exchange_user.total_airdrop_point;
    const originalBiddingAirdropPoint =
      userItem.exchange_user.total_bidding_point;
    const originalListingAirdropPoint =
      userItem.exchange_user.total_listing_point;
    const originalSaleAirdropPoint = userItem.exchange_user.total_sale_point;
    const originalExtraAirdropPoint = userItem.exchange_user.total_extra_point;
    userObject[id] = {
      originalTotalAirdropPoint,
      originalBiddingAirdropPoint,
      originalListingAirdropPoint,
      originalSaleAirdropPoint,
      originalExtraAirdropPoint,
      total_bidding: 0,
      total_sale: 0,
      total_listing: 0,
      total_extra: 0,
      total_extra_detail: { data: [] },
      total_multiplier_detail: { total_multiplier: 0, data: [] },
    };
    if (userAirdropMultiplier) {
      userObject[id].total_multiplier_detail.data.push({
        name: "Top 200 Boost",
        boost: `${userAirdropMultiplier * 100}%`,
      });
      userObject[id].total_multiplier_detail.total_multiplier +=
        userAirdropMultiplier;
    }

    // Get user og pass count
    const ogPassCount = await getWenOGPassCount(userAddress);
    if (ogPassCount > 0) {
      let boostData;
      let multiplier;
      if (ogPassCount > 9) {
        boostData = {
          name: "Wen OG Pass Boost",
          boost: `${0.45 * 100}%`,
        };
        multiplier = 0.45;
      } else {
        boostData = {
          name: "Wen OG Pass Boost",
          boost: `${0.05 * ogPassCount * 100}%`,
        };
        multiplier = 0.05 * ogPassCount;
      }
      userObject[id].total_multiplier_detail.data.push(boostData);
      if (userObject[id].total_multiplier_detail.total_multiplier == 0) {
        userObject[id].total_multiplier_detail.total_multiplier +=
          multiplier + 1;
      } else {
        userObject[id].total_multiplier_detail.total_multiplier += multiplier;
      }
    }

    if (userObject[id].total_multiplier_detail.total_multiplier == 0) {
      userObject[id].total_multiplier_detail.total_multiplier = 1;
    }
  }

  // 3. 가장 최근 airdrop stat을 가져온다.
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
  // 2. Listing 업데이트
  // 2-1. currentTime > valid_listing_timestamp 인 전체 Listing을 구한다.
  const currentTs = dayjs().unix();
  let validListing = [];
  listings.forEach((item) => {
    if (currentTs >= parseInt(item.listing_valid_timestamp)) {
      validListing.push(item);
    }
  });
  // 2-2. Valid listing 의 합을 구한다. (user 의 multiplier 도 함께 곱해준다.)
  let validListingPrePointSum = 0;
  validListing.forEach((item) => {
    validListingPrePointSum +=
      item.pre_point *
      userObject[item.exchange_user.id].total_multiplier_detail
        .total_multiplier;
  });

  // 2-3. Valid Listing 과 Pre-Point 의 교환 비율을 구한다.
  let listingConversionRatio = totalListingPoint / validListingPrePointSum;
  let listingAddedPoint = 0;

  // 2-4. 유저 별 Listing point 를 계산해 더해준다.
  validListing.forEach((item) => {
    const point =
      item.pre_point *
      userObject[item.exchange_user.id].total_multiplier_detail
        .total_multiplier *
      listingConversionRatio;
    userObject[item.exchange_user.id].total_listing += point;
    item.airdrop_point = point;
    listingAddedPoint += point;
  });

  // 2-5. Update All Listing airdrop-history-log , is_distributed = true, snapshot_id = snapshot

  for (let item of validListing) {
    await strapi.entityService.update(
      "api::airdrop-history-log.airdrop-history-log",
      item.id,
      {
        data: {
          is_distributed: true,
          snapshot_id: snapshotId,
          airdrop_point: item.airdrop_point,
        },
      }
    );
  }

  // 3. Sale 계산

  // 3-1. Sale 의 합을 구한다. (user 의 multiplier 도 함께 곱해준다.)
  let salesPrePointSum = 0;
  sales.forEach((item) => {
    salesPrePointSum +=
      item.pre_point *
      userObject[item.exchange_user.id].total_multiplier_detail
        .total_multiplier;
  });

  // 3-2. Sale 과 Pre-Point 의 교환 비율을 구한다.
  let salesConversionRatio = totalSalePoint / salesPrePointSum;
  let salesAddedPoint = 0;

  // 3-3. 유저 별 Listing point 를 계산해 더해준다.
  sales.forEach((item) => {
    const point =
      item.pre_point *
      userObject[item.exchange_user.id].total_multiplier_detail
        .total_multiplier *
      salesConversionRatio;
    userObject[item.exchange_user.id].total_sale += point;
    item.airdrop_point = point;
    salesAddedPoint += point;
  });

  // 3-4. Update All sales airdrop-history-log , is_distributed = true, snapshot_id = snapshot

  for (let item of sales) {
    await strapi.entityService.update(
      "api::airdrop-history-log.airdrop-history-log",
      item.id,
      {
        data: {
          is_distributed: true,
          snapshot_id: snapshotId,
          airdrop_point: item.airdrop_point,
        },
      }
    );
  }

  // 4. [TODO] Bidding
  let biddingAddedPoint = 0;

  // 5. 추가 포인트 관련 계산
  let extraAddedPoint = 0;
  // 3-3. 유저 별 Listing point 를 계산해 더해준다.
  extras.forEach((item) => {
    const point = item.airdrop_point;
    userObject[item.exchange_user.id].total_extra += point;
    extraAddedPoint += point;
  });

  // 3-4. Update All extras airdrop-history-log , is_distributed = true, snapshot_id = snapshot

  for (let item of extras) {
    await strapi.entityService.update(
      "api::airdrop-history-log.airdrop-history-log",
      item.id,
      {
        data: {
          is_distributed: true,
          snapshot_id: snapshotId,
        },
      }
    );
  }
  // 6. 전체 유저 스탯 계산
  for (const key in userObject) {
    if (Object.hasOwnProperty.call(userObject, key)) {
      const userData = userObject[key];
      if (
        userData.total_bidding != 0 ||
        userData.total_sale != 0 ||
        userData.total_listing != 0 ||
        userData.total_extra != 0
      ) {
        // 1. Airdrop Stat Log 추가
        await strapi.entityService.create(
          "api::airdrop-stat-log.airdrop-stat-log",
          {
            data: {
              sale_point_24h: userData.total_sale,
              listing_point_24h: userData.total_listing,
              bidding_point_24h: userData.total_bidding,
              extra_point_24h: userData.total_extra,
              exchange_user: key,
              timestamp: dayjs().unix(),
              multiplier_detail: userData.total_multiplier_detail,
              total_trade_point:
                userData.total_sale +
                userData.total_listing +
                userData.total_bidding,
              total_airdrop_point:
                userData.total_sale +
                userData.total_listing +
                userData.total_bidding +
                userData.total_extra,
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
              total_airdrop_point:
                userData.originalTotalAirdropPoint +
                userData.total_sale +
                userData.total_listing +
                userData.total_bidding +
                userData.total_extra,
              total_bidding_point:
                userData.originalBiddingAirdropPoint + userData.total_bidding,
              total_listing_point:
                userData.originalListingAirdropPoint + userData.total_listing,
              total_sale_point:
                userData.originalSaleAirdropPoint + userData.total_sale,
              total_extra_point:
                userData.originalExtraAirdropPoint + userData.total_extra,
            },
          }
        );
      }
    }
  }

  // 7. airdrop-distribution-stat 업데이트
  await strapi.entityService.create(
    "api::airdrop-distribution-stat.airdrop-distribution-stat",
    {
      data: {
        distributed_listing_point: listingAddedPoint,
        distributed_bidding_point: biddingAddedPoint,
        distributed_sale_point: salesAddedPoint,
        distributed_extra_point: extraAddedPoint,
        timestamp: dayjs().unix(),
        snapshot_id: snapshotId,
      },
    }
  );
};

async function getWenOGPassCount(address) {
  const ogpassStakingContract = new ethers.Contract(
    "0xcCBA7f02f53b3cE11eBF9Bf15067429fE6479bC2",
    [
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "stakedTokensByUser",
        outputs: [
          {
            internalType: "uint256[]",
            name: "",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    jsonRpcProvider_cron
  );

  const staked = await ogpassStakingContract.stakedTokensByUser(address);
  return staked.length;
}
const airdropStatCombined = async ({ strapi }) => {
  try {
    strapi.log.info("[CRON TASK] - START | AIRDROP STAT");
    await createAirdropStat({ strapi });
    await updateUserMultiplier({ strapi });
    await updateCollectionAirdrop({strapi});
    strapi.log.info("[CRON TASK] - COMPLETE | AIRDROP STAT");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({error, identifier: "Cron - airdropStatCombined"})
    strapi.log.error(`airdropStatCombined error- ${error.message}`);
  }
};

module.exports = {
  createAirdropStat,
  updateUserMultiplier,
  updateCollectionAirdrop,
  airdropStatCombined,
};
