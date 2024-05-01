const { ethers, BigNumber } = require("ethers");
const { Web3 } = require("web3");
const dayjs = require("dayjs");

const web3 = new Web3();

const {
  getNFTOwner,
  weiToEther,
  getERC20Balance,
} = require("../api/sdk/controllers/blockchainHelper");
const { updateBestOffer } = require("./collectionStats");
const { WEN_ETH_ADDRESS } = require("../utils/constants");

const updateUserBatchOrderStatus = async ({ strapi, user }) => {
  // 1. Check if the user is wen exchange user
  const userCheck = await strapi.db.query("api::exchange-user.exchange-user").findOne({
    where: {
      address: user,
    },
  });


  if (!userCheck) {
    console.log(`address ${user} doesn't exist on db`);
    return;
  }

  // 1. Get User's current wenETH Balance
  const wenETHBalance = BigNumber.from(
    (await getERC20Balance(WEN_ETH_ADDRESS, user)).toString()
  );

  // 2. Get All Batch Buy Orders
  const batchBuyOrders = await strapi.db
    .query("api::batch-buy-order.batch-buy-order")
    .findMany({
      where: {
        $and: [
          {
            maker: user,
          },
          { is_cancelled: false },
          { is_all_sold: false },
        ],
      },
      orderBy: { single_price_in_eth: "DESC" },
      populate: {
        collection: true,
        buy_orders: true,
      },
    });

  // 3. Update if any batch buy were expired.
  const currentTs = dayjs().unix();
  for (let i = 0; i < batchBuyOrders.length; i++) {
    const batchBuyOrder = batchBuyOrders[i];
    if (batchBuyOrder.expiration_time < currentTs) {
      await strapi.db.query("api::batch-buy-order.batch-buy-order").delete({
        where: {
          id: batchBuyOrder.id,
        }
      })
    } else {
      // not expired 된 batchBuyOrder
      const single_price = BigNumber.from(batchBuyOrder.single_price);
      const maxShowingCount = wenETHBalance.div(single_price);
      let showingOrders = [];
      let hiddenOrders = [];
      let stateChangedToShowingOrderIds = [];
      let stateChangedToHiddenOrderIds = [];

      batchBuyOrder.buy_orders.forEach((buyOrder) => {
        if (!buyOrder.is_sold) {
          if (buyOrder.is_hidden) {
            hiddenOrders.push(buyOrder);
          } else {
            showingOrders.push(buyOrder);
          }
        }
      });

      if (showingOrders.length > maxShowingCount) {
        let difference = showingOrders.length - maxShowingCount;
        console.log("줄여줘야함. current count2 ", difference);

        for (let i = 0; i < difference; i++) {
          const changingOrder = showingOrders[i];
          const changed = await strapi.entityService.update(
            "api::buy-order.buy-order",
            changingOrder.id,
            {
              data: {
                is_hidden: true,
              },
            }
          );
          stateChangedToHiddenOrderIds.push(changed.id);
        }
      } else {
        let d1 = maxShowingCount - showingOrders.length;
        let d2 = hiddenOrders.length;
        let difference = Math.min(d1, d2);
        console.log(
          "늘려줘야함. current count: ",
          "showingOrders : ",
          showingOrders.length,
          "hiddenOrders : ",
          hiddenOrders.length,
          "maxShowingCount : ",
          maxShowingCount.toString()
        );
        for (let i = 0; i < difference; i++) {
          const changingOrder = hiddenOrders[i];
          const changed = await strapi.entityService.update(
            "api::buy-order.buy-order",
            changingOrder.id,
            {
              data: {
                is_hidden: false,
              },
            }
          );
          stateChangedToShowingOrderIds.push(changed.id);
        }
      }

      console.log(
        "stateChangedToShowingOrderIds: ",
        stateChangedToShowingOrderIds
      );
      console.log(
        "stateChangedToHiddenOrderIds: ",
        stateChangedToHiddenOrderIds
      );

      if (
        stateChangedToShowingOrderIds.length > 0 ||
        stateChangedToHiddenOrderIds.length > 0
      ) {
        const collectionAddress = batchBuyOrder.collection.contract_address;
       await updateBestOffer({strapi, contractAddress :collectionAddress })
      }
    }
  }
};

const updateUserBatchOrderStatusWithoutUpdateBestOffer = async ({ strapi, user }) => {
  // 1. Check if the user is wen exchange user
  const userCheck = await strapi.db.query("api::exchange-user.exchange-user").findOne({
    where: {
      address: user,
    },
  });


  if (!userCheck) {
    console.log(`address ${user} doesn't exist on db`);
    return;
  }

  // 1. Get User's current wenETH Balance
  const wenETHBalance = BigNumber.from(
    (await getERC20Balance(WEN_ETH_ADDRESS, user)).toString()
  );

  // 2. Get All Batch Buy Orders
  const batchBuyOrders = await strapi.db
    .query("api::batch-buy-order.batch-buy-order")
    .findMany({
      where: {
        $and: [
          {
            maker: user,
          },
          { is_cancelled: false },
          { is_all_sold: false },
        ],
      },
      orderBy: { single_price_in_eth: "DESC" },
      populate: {
        collection: true,
        buy_orders: true,
      },
    });

  // 3. Update if any batch buy were expired.
  const currentTs = dayjs().unix();
  for (let i = 0; i < batchBuyOrders.length; i++) {
    const batchBuyOrder = batchBuyOrders[i];
    if (batchBuyOrder.expiration_time < currentTs) {
      await strapi.db.query("api::batch-buy-order.batch-buy-order").delete({
        where: {
          id: batchBuyOrder.id,
        }
      })
    } else {
      // not expired 된 batchBuyOrder
      const single_price = BigNumber.from(batchBuyOrder.single_price);
      const maxShowingCount = wenETHBalance.div(single_price);
      let showingOrders = [];
      let hiddenOrders = [];
      let stateChangedToShowingOrderIds = [];
      let stateChangedToHiddenOrderIds = [];

      batchBuyOrder.buy_orders.forEach((buyOrder) => {
        if (!buyOrder.is_sold) {
          if (buyOrder.is_hidden) {
            hiddenOrders.push(buyOrder);
          } else {
            showingOrders.push(buyOrder);
          }
        }
      });

      if (showingOrders.length > maxShowingCount) {
        let difference = showingOrders.length - maxShowingCount;
        console.log("줄여줘야함. current count2 ", difference);

        for (let i = 0; i < difference; i++) {
          const changingOrder = showingOrders[i];
          const changed = await strapi.entityService.update(
            "api::buy-order.buy-order",
            changingOrder.id,
            {
              data: {
                is_hidden: true,
              },
            }
          );
          stateChangedToHiddenOrderIds.push(changed.id);
        }
      } else {
        let d1 = maxShowingCount - showingOrders.length;
        let d2 = hiddenOrders.length;
        let difference = Math.min(d1, d2);
        console.log(
          "늘려줘야함. current count: ",
          "showingOrders : ",
          showingOrders.length,
          "hiddenOrders : ",
          hiddenOrders.length,
          "maxShowingCount : ",
          maxShowingCount.toString()
        );
        for (let i = 0; i < difference; i++) {
          const changingOrder = hiddenOrders[i];
          const changed = await strapi.entityService.update(
            "api::buy-order.buy-order",
            changingOrder.id,
            {
              data: {
                is_hidden: false,
              },
            }
          );
          stateChangedToShowingOrderIds.push(changed.id);
        }
      }

      console.log(
        "stateChangedToShowingOrderIds: ",
        stateChangedToShowingOrderIds
      );
      console.log(
        "stateChangedToHiddenOrderIds: ",
        stateChangedToHiddenOrderIds
      );

      // if (
      //   stateChangedToShowingOrderIds.length > 0 ||
      //   stateChangedToHiddenOrderIds.length > 0
      // ) {
      //   const collectionAddress = batchBuyOrder.collection.contract_address;
      //  await updateBestOffer({strapi, contractAddress :collectionAddress })
      // }
    }
  }
};
module.exports = { updateUserBatchOrderStatus , updateUserBatchOrderStatusWithoutUpdateBestOffer};
