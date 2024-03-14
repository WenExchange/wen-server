
async function batchUpdateFloorPrice({strapi, addressList}) {
    for (let address of addressList) {
        // don't use await. just send it to server.
        try {
          await updateFloorPrice({ strapi }, address);
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
      await strapi.entityService.update(
        "api::collection.collection",
        orderData.collection.id,
        {
          data: {
            floor_price: 0,
          },
        }
      );
      console.log("no order data", contractAddress);
    }
  }


  module.exports = { batchUpdateFloorPrice, updateFloorPrice };
