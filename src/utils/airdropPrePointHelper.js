const dayjs = require("dayjs");

const LISTING_UNDER_FP = 6;

const updateListingPoint = async (
  _userAddress,
  _collectionAddress,
  _listingPrice,
  { strapi }
) => {
  let updated = false;
  let prePoint = 0;
  const collection = await strapi.db
    .query("api::collection.collection")
    .findOne({
      where: {
        contract_address: _collectionAddress,
      },
    });

  const user = strapi.db.query("api::exchange-user.exchange-user").findOne({
    where: {
      address: _userAddress,
    },
  });

  const fp = parseFloat(collection.floor_price);
  if (_listingPrice <= fp) {
    prePoint = LISTING_UNDER_FP;
  } else {
    const priceDifferencePercentage = (_listingPrice - fp) / fp;
    prePoint = 4 * (1 - priceDifferencePercentage * 2);
  }

  if (prePoint > 0) {
    const collectionMultiplier = collection.airdrop_multiplier;
  }

  return {
    updated,
  };
};

const updateBuyingPoint = async ({ strapi }) => {};

const updateBiddingPoint = async ({ strapi }) => {};
