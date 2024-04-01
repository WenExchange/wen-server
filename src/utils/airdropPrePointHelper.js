const dayjs = require("dayjs");
const { AIRDROP_TYPE } = require("./constants");

const LISTING_UNDER_FP = 6;
const VALID_COLLECTION_THRESHOLD = 0.5;

const updateListingPoint = async (
  _userAddress,
  _collectionAddress,
  _listingPrice,
  _nftTradeLogId,
  { strapi }
) => {
  let updated = false;
  let prePoint = 0;
  const collection = await strapi.db
    .query("api::collection.collection")
    .findOne({
      where: {
        contract_address: _collectionAddress,
        publishedAt: {
          $notNull: true,
        },
      },
    });
  if (!collection || !collection.publishedAt) return;

  const user = strapi.db.query("api::exchange-user.exchange-user").findOne({
    where: {
      address: _userAddress,
    },
  });
  if (!user) return;

  const fp = parseFloat(collection.floor_price);
  if (_listingPrice <= fp) {
    prePoint = LISTING_UNDER_FP;
  } else {
    const priceDifferencePercentage = (_listingPrice - fp) / fp;
    prePoint = 4 * (1 - priceDifferencePercentage * 2);
  }

  // Check if this is valid collection.
  let isValidCollection = false;

  if (collection.publishedAt) {
    const publishedAtTS = parseInt(
      (Date.parse(collection.publishedAt) / 1000).toString()
    );
    const currentTS = dayjs().unix();
    if (currentTS - publishedAtTS < 86400) {
      console.log(
        "here publishedAtTs : ",
        currentTS - publishedAtTS,
        publishedAtTS,
        currentTS
      );
      // 생긴지 24시간 이내
      if (
        collection.volume_24h > VALID_COLLECTION_THRESHOLD / 2 ||
        collection.airdrop_multiplier > 1
      ) {
        console.log(
          "here 4 publishedAtTs : ",
          currentTS - publishedAtTS,
          publishedAtTS,
          currentTS
        );
        isValidCollection = true;
      }
    } else {
      console.log(
        "here 2 publishedAtTs : ",
        currentTS - publishedAtTS,
        publishedAtTS,
        currentTS
      );
      if (collection.volume_24h > VALID_COLLECTION_THRESHOLD) {
        isValidCollection = true;
        console.log(
          "here 3 publishedAtTs : ",
          currentTS - publishedAtTS,
          publishedAtTS,
          currentTS
        );
      }
    }
  }

  if (prePoint > 0 && isValidCollection) {
    const collectionMultiplier = collection.airdrop_multiplier;
    if (collectionMultiplier > 1) {
      prePoint = prePoint * collectionMultiplier;
    }
    console.log("prePoint: ", prePoint);
    await strapi.db
      .query("api::airdrop-history-log.airdrop-history-log")
      .create({
        data: {
          exchange_user: user.id,
          type: AIRDROP_TYPE.LISTING,
          timestamp: dayjs().unix(),
          nft_trade_log: _nftTradeLogId,
          pre_point: prePoint,
        },
      });
    updated = true;
  }

  return {
    updated,
    prePoint,
  };
};

const updateBuyingPoint = async ({ strapi }) => {};

const updateBiddingPoint = async ({ strapi }) => {};
