const dayjs = require("dayjs");
const { AIRDROP_TYPE } = require("./constants");

const LISTING_UNDER_FP = 6;
const VALID_COLLECTION_THRESHOLD = 0.5;
const LISTING_VALID_DURATION = 60 * 60 * 6; // TODO: 바꿔~

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
            {
              exchange_user: {
                id: user.id,
              },
            },
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
    if (!collection) return;

    const user = await strapi.db
      .query("api::exchange-user.exchange-user")
      .findOne({
        where: {
          address: _userAddress,
        },
      });
    if (!user) return;

    let fp = 0;
    // 2. Check prepoint
    if (!collection.floor_price || Number(collection.floor_price) === 0) {
      prePoint = 0;
    } else {
      fp = parseFloat(collection.floor_price);
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
        if (
          collection.volume_24h > VALID_COLLECTION_THRESHOLD ||
          collection.airdrop_multiplier >= 2
        ) {
          isValidCollection = true;
        }
      }
    }

    // 4. Check prepoint
    console.log(
      "userId : ",
      user.id,
      "prePoint: ",
      prePoint,
      "fp : ",
      fp,
      "token_id ",
      _tokenId
    );

    if (prePoint > 0 && isValidCollection) {
      const collectionMultiplier = collection.airdrop_multiplier;
      if (collectionMultiplier > 1) {
        prePoint = prePoint * collectionMultiplier;
      }
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

const updateSalePoint = async (
  _paymentToken,
  _price,
  _taker,
  _collectionAddress,
  _tokenId,
  _nftTradeLogId,
  { strapi }
) => {
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
  if (!collection) return;

  const user = await strapi.db
    .query("api::exchange-user.exchange-user")
    .findOne({
      where: {
        address: _taker,
      },
    });
  if (!user) return;

  // 2. Check prepoint

  const baseValue = 1; // 기본값 설정, 필요에 따라 조정할 수 있습니다.
  const scaleFactor = 8; // 증가율을 조절하는 스케일 팩터, 필요에 따라 조정할 수 있습니다.

  // 3.  Check if this is valid collection and if so, update prepoint.
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
        // pre-point 계산
        prePoint = baseValue * Math.log(scaleFactor * _price + 1);
        isValidCollection = true;
      }
    } else {
      if (
        collection.volume_24h > VALID_COLLECTION_THRESHOLD ||
        collection.airdrop_multiplier >= 2
      ) {
        // pre-point 계산
        prePoint = baseValue * Math.log(scaleFactor * _price + 1);
        isValidCollection = true;
      }
    }
  }

  console.log("token", _tokenId, "userId : ", user.id, "prePoint: ", prePoint);

  // 4. Check prepoint
  if (prePoint > 0 && isValidCollection) {
    const collectionMultiplier = collection.airdrop_multiplier;
    if (collectionMultiplier > 1) {
      prePoint = prePoint * collectionMultiplier;
    }

    const currentTs = dayjs().unix();
    const updatedLog = await strapi.db
      .query("api::airdrop-history-log.airdrop-history-log")
      .create({
        data: {
          exchange_user: user.id,
          type: AIRDROP_TYPE.SALE,
          timestamp: currentTs,
          nft_trade_log: _nftTradeLogId,
          pre_point: prePoint,
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
};

const updateBiddingPoint = async ({ strapi }) => {};

module.exports = {
  updateListingPoint,
  updateSalePoint,
};
