const { SDK } = require("../utils/constants");
const { SALEKIND_KIND_BATCH_OFFER_ERC721S } = SDK;

async function batchUpdateFloorPrice({ strapi, addressList }) {
  for (let address of addressList) {
    // don't use await. just send it to server.
    try {
      await updateFloorPrice({ strapi }, address);
      await updateOrdersCount({ strapi }, address);
    } catch (error) {
      console.log("updateFloorPrice", error);
    }
  }
}

async function updateFloorPrice({ strapi }, contractAddress) {
  const orderData = await strapi.db.query("api::order.order").findOne({
    where: {
      contract_address: contractAddress,
    },
    orderBy: {
      price_eth: "asc",
    },
    populate: {
      collection: true,
    },
  });

  if (orderData) {
    let currentCollectionFP;
    if (orderData.collection.floor_price) {
      currentCollectionFP = orderData.collection.floor_price;
    } else {
      currentCollectionFP = 0;
    }
    const realFP = orderData.price_eth;

    if (realFP != currentCollectionFP) {
      await strapi.entityService.update(
        "api::collection.collection",
        orderData.collection.id,
        {
          data: {
            floor_price: realFP,
          },
        }
      );
      console.log("updated! real FP", realFP, "previous", currentCollectionFP);
    } else {
      console.log(
        "didn't updated! real FP",
        realFP,
        "previous",
        currentCollectionFP
      );
    }
  } else {
    // If there is no Order data, set the floor_price to 0

    const entry = await strapi.db.query("api::collection.collection").update({
      where: { contract_address: contractAddress },
      data: {
        floor_price: 0,
      },
    });

    console.log("no order data", contractAddress);
  }
}

async function updateBestOffer({ strapi, contractAddress }) {
  try {
    const orderData = await strapi.db.query("api::buy-order.buy-order").findOne({
      where: {
        $and: [
          {
            collection: {
              contract_address: contractAddress,
            },
          },
          {
            collection: {
              publishedAt: {
                $notNull: true
              }
            }
          },
          {
            batch_buy_order: { is_cancelled: false },
          },
          {
            batch_buy_order:  { is_all_sold: false },
          },
          {
            batch_buy_order:  { sale_kind: SALEKIND_KIND_BATCH_OFFER_ERC721S },
          },
          {
            is_hidden: false,
          },
          {
            is_sold: false
          }
         
        ]
      },
      orderBy: {
        single_price_eth: "desc",
      },
      populate: {
        collection :{
          select: ["id", "best_offer"]
        },
      },
    });
  

    if (orderData) {
      let prevBestOffer = Number(orderData?.collection.best_offer);
      if (Number.isNaN(prevBestOffer)) prevBestOffer = 0;

      let currentBestOffer = Number(orderData?.single_price_eth)
      if (Number.isNaN(currentBestOffer)) currentBestOffer = 0

      console.log("update best offer : ", prevBestOffer, currentBestOffer);

      if (prevBestOffer !== currentBestOffer) {
        await strapi.db.query("api::collection.collection").update({
          where: { id: orderData.collection.id },
          data: {
            best_offer: currentBestOffer,
          },
        });
      }
    } else {
      // If there is no Order data, set the floor_price to 0
      await strapi.db.query("api::collection.collection").update({
        where: { contract_address: contractAddress },
        data: {
          best_offer: 0,
        },
      });
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function updateOwnerCount({ strapi }, collection_address) {
  const realOwnerCount = (
    await strapi.db.connection.raw(
      `SELECT COUNT(DISTINCT nfts.owner) AS unique_owners_count
    FROM nfts
    JOIN nfts_collection_links ON nfts.id = nfts_collection_links.nft_id
    JOIN collections ON nfts_collection_links.collection_id = collections.id
    WHERE collections.contract_address = "${collection_address}"`
    )
  )[0][0].unique_owners_count;

  let collection = await strapi.db.query("api::collection.collection").findOne({
    where: {
      contract_address: collection_address,
    },
  });
  let currentOwnerCount = collection.owner_count;

  if (realOwnerCount.toString() != currentOwnerCount.toString()) {
    await strapi.entityService.update(
      "api::collection.collection",
      collection.id,
      {
        data: {
          owner_count: realOwnerCount,
        },
      }
    );
    console.log(
      "updated! real owner count",
      realOwnerCount,
      "previous",
      collection.owner_count
    );
  } else {
    console.log(
      "didn't updated! real owner count",
      realOwnerCount,
      "previous",
      collection.owner_count
    );
  }
}

async function updateOrdersCount({ strapi }, collection_address) {
  const realOrdersCount = (
    await strapi.db.connection.raw(
      `SELECT COUNT(orders.id) AS unique_orders_count
    FROM orders
    JOIN orders_collection_links ON orders.id = orders_collection_links.order_id
    JOIN collections ON orders_collection_links.collection_id = collections.id
    WHERE collections.contract_address = "${collection_address}"`
    )
  )[0][0].unique_orders_count;

  let collection = await strapi.db.query("api::collection.collection").findOne({
    where: {
      contract_address: collection_address,
    },
  });
  let currentListingCount = collection.listing_count;

  if (realOrdersCount.toString() != currentListingCount.toString()) {
    await strapi.entityService.update(
      "api::collection.collection",
      collection.id,
      {
        data: {
          listing_count: realOrdersCount,
        },
      }
    );
    console.log(
      "updated! real orders count",
      realOrdersCount,
      "previous",
      collection.listing_count
    );
  } else {
    console.log(
      "didn't updated! real orders count",
      realOrdersCount,
      "previous",
      collection.listing_count
    );
  }
}

async function update1hourStat({ strapi }, collection_address) {
  const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);

  // 연도, 월, 일, 시, 분, 초, 밀리초를 각각 추출
  const year = oneHourAgo.getFullYear();
  const month = oneHourAgo.getMonth() + 1; // 월은 0부터 시작하므로 1을 더함
  const day = oneHourAgo.getDate();
  const hours = oneHourAgo.getHours();
  const minutes = oneHourAgo.getMinutes();
  const seconds = oneHourAgo.getSeconds();
  const milliseconds = oneHourAgo.getMilliseconds();

  const formattedTime =
    `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")} ` +
    `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.` +
    `${(milliseconds + "000000").substring(0, 6)}`;

  console.log(formattedTime);

  const realOrdersCount = await strapi.db.connection.context.raw(
    `SELECT nft_trade_logs.*
    FROM nft_trade_logs
    JOIN nft_trade_logs_nft_links ON nft_trade_logs.id = nft_trade_logs_nft_links.nft_trade_log_id
    JOIN nfts ON nft_trade_logs_nft_links.nft_id = nfts.id
    JOIN nfts_collection_links ON nfts.id = nfts_collection_links.nft_id
    JOIN collections ON nfts_collection_links.collection_id = collections.id
    WHERE collections.contract_address = "${collection_address}" AND nft_trade_logs.type = "SALE"
    AND nft_trade_logs.created_at >= "${formattedTime}"`
  );

  console.log(realOrdersCount);
}

module.exports = {
  batchUpdateFloorPrice,
  updateFloorPrice,
  updateBestOffer,
  updateOwnerCount,
  updateOrdersCount,
  update1hourStat,
};
