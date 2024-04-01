const dayjs = require("dayjs");
const { AIRDROP_TYPE } = require("./constants");

const LISTING_UNDER_FP = 6;
const VALID_COLLECTION_THRESHOLD = 0.5;
const LISTING_VALID_DURATION = 60 * 60 * 6;

const updateListingPoint = async (
  _isCancelRequest,
  _userAddress,
  _collectionAddress,
  _tokenId,
  _listingPrice,
  _nftTradeLogId,
  { strapi }
) => {
  if (_isCancelRequest) {
    // Cancel Listing Point

    // 1. User 가 있나 체크
    const user = await strapi.db
      .query("api::exchange-user.exchange-user")
      .findOne({
        where: {
          address: _userAddress,
        },
      });
    if (!user) return;

    // 1. airdrop-history-log 가 있나 체크.
    const airdropHistoryLog = await strapi.db
      .query("api::airdrop-history-log.airdrop-history-log")
      .findOne({
        where: {
          $and: [
            { exchange_user: user.id },
            { nft_address: _collectionAddress },
            {
              is_cancelled: false,
            },
            {
              is_distributed: false,
            },
            {
              token_id: _tokenId,
            },
          ],
        },
      });
    if (!airdropHistoryLog) return;

    // 2. Valid time 을 지났나 체크
    const currentTs = dayjs().unix();
    if (airdropHistoryLog.listing_valid_timestamp <= currentTs) {
      console.log(
        `Don't Cancel. This is valid listing log since current ts(${currentTs}) past listing valid ts.${airdropHistoryLog.listing_valid_timestamp}`
      );
    } else {
      // 3. Cancel Listing Log.
      await strapi.entityService.update(
        "api::airdrop-history-log.airdrop-history-log",
        airdropHistoryLog.id,
        {
          data: {
            is_cancelled: true,
          },
        }
      );
      console.log(
        `Cancelled. This is not valid listing log since current ts(${currentTs}) didn't past listing valid ts.${airdropHistoryLog.listing_valid_timestamp}`
      );
    }

    //
  } else {
    let updated = false;
    let prePoint = 0;

    // 1. Collection, Exchange User Validation
    const collection = await strapi.db
      .query("api::collection.collection")
      .findOne({
        where: {
          $and: [
            { contract_address: _collectionAddress },
            {
              publishedAt: {
                $notNull: true,
              },
            },
          ],
        },
      });
    if (!collection || !collection.publishedAt) return;

    const user = await strapi.db
      .query("api::exchange-user.exchange-user")
      .findOne({
        where: {
          address: _userAddress,
        },
      });
    if (!user) return;

    // 2. Check prepoint
    const fp = parseFloat(collection.floor_price);
    if (_listingPrice <= fp) {
      prePoint = LISTING_UNDER_FP;
    } else {
      const priceDifferencePercentage = Math.abs(_listingPrice - fp) / fp;
      const k = 10; // 감소율 조정 상수

      if (priceDifferencePercentage >= 0.3) {
        prePoint = 0; // 가격 차이가 30% 이상이면 점수를 0으로 설정
      } else {
        prePoint = 4 * Math.exp(-k * priceDifferencePercentage); // 가격 차이에 따라 지수적으로 점수 계산
      }
    }
    //3.  Check if this is valid collection.
    let isValidCollection = false;

    if (collection.publishedAt) {
      const publishedAtTS = parseInt(
        (Date.parse(collection.publishedAt) / 1000).toString()
      );
      const currentTS = dayjs().unix();
      if (currentTS - publishedAtTS < 86400) {
        // 생긴지 24시간 이내
        if (
          collection.volume_24h > VALID_COLLECTION_THRESHOLD / 2 ||
          collection.airdrop_multiplier > 1
        ) {
          isValidCollection = true;
        }
      } else {
        if (collection.volume_24h > VALID_COLLECTION_THRESHOLD) {
          isValidCollection = true;
        }
      }
    }

    // 4. Check prepoint
    if (prePoint > 0 && isValidCollection) {
      const collectionMultiplier = collection.airdrop_multiplier;
      if (collectionMultiplier > 1) {
        prePoint = prePoint * collectionMultiplier;
      }
      // console.log("userId : ", user.id, "prePoint: ", prePoint, "fp : ", fp);
      const currentTs = dayjs().unix();
      const updatedLog = await strapi.db
        .query("api::airdrop-history-log.airdrop-history-log")
        .create({
          data: {
            exchange_user: user.id,
            type: AIRDROP_TYPE.LISTING,
            timestamp: currentTs,
            nft_trade_log: _nftTradeLogId,
            pre_point: prePoint,
            listing_valid_timestamp: currentTs + LISTING_VALID_DURATION,
            floor_price_atm: fp,
            token_id: _tokenId,
            nft_address: _collectionAddress,
          },
        });
      updated = true;
      return {
        updated,
        prePoint,
        updatedLogId: updatedLog.id,
      };
    } else {
      return {
        updated,
        prePoint,
      };
    }
  }
};

const updateSalePoint = async ({ strapi }) => {};

const updateBiddingPoint = async ({ strapi }) => {};

module.exports = {
  updateListingPoint,
};
