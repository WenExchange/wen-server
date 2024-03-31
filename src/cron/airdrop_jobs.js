const dayjs = require("dayjs");

const updateCollectionAirdrop = async ({ strapi }) => {
  //  TOP 11-20 : 1.5x
  //  TOP 4-10 : 2x
  //  TOP 1-3 : 4x

  // 1. Get All Collection by volume_24h
  const collectionData = await strapi.db
    .query("api::collection.collection")
    .findMany({
      orderBy: {
        volume_24h: "desc",
      },
    });

  for (let i of collectionData) {
    console.log(i.name, i.volume_24h);
  }

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

  const afterCollectionData = await strapi.db
    .query("api::collection.collection")
    .findMany({
      orderBy: {
        airdrop_multiplier: "desc",
      },
    });

  for (let i of afterCollectionData) {
    console.log(i.name, i.volume_24h, i.airdrop_multiplier);
  }
};

// 1. Update Collection Airdrop Multiplier
// 2.

module.exports = {
  updateCollectionAirdrop,
};
