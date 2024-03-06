
const listingCollections = require("./listing_collections.json")
const axios = require("axios")

const limit = 30
const breakTime = 1000 * 0.8 // 0.5 s

const createCollection = ({strapi, collectionData}) => {
  return strapi.entityService.create('api::collection.collection', {
    data: {
        ...collectionData,
    }
})
}

const createNFTs = async ({strapi, collectionEntry}) => {
  const nftMetadataTotal = [...Array(Number(collectionEntry.total_supply)).keys()];
  for (let i = 0; i < nftMetadataTotal.length; i += limit) {
    console.log(`${collectionEntry.name} - start ${i + 1}`);
      const nftMetadataChunk = nftMetadataTotal.slice(i, i + limit);
      const nftMetadataPromises = nftMetadataChunk.map(value => {
        // TODO : Price , Owner 가져오기
          return getNFTMetadata(`${collectionEntry.token_uri}/${value}`).then(metadata => {
              let image_url = metadata?.image || "";
              // ipfs 변환
              if (image_url.startsWith('ipfs://')) {
                  image_url = image_url.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }
              const attributes = Array.isArray(metadata?.attributes) && metadata?.attributes.length > 0 ? metadata.attributes : null;

              return {
                  collection: collectionEntry.id,
                  name: metadata?.name || "",
                  image_url,
                  token_id: value,
                  attributes,
              };
          }).then(nftData => {
              return strapi.entityService.create('api::nft.nft', {
                  data: {
                      ...nftData
                  },
              });
          });
      });

      await Promise.all(nftMetadataPromises);
      if (i + limit < nftMetadataTotal.length) {
          await new Promise(resolve => setTimeout(resolve, breakTime)); // 1초 대기
      }
  }
}


  const addCollelctions = async ({strapi}) => {
      try {
    await deleteCollectionsAndNFTsForTest({strapi})

    const createCollectionPromises = listingCollections.map(collectionData => {
      return createCollection({strapi, collectionData }).then(collectionEntry => {
        return createNFTs({strapi, collectionEntry})
      })
    })
        // const collectionEntry = await createCollection({strapi, collectionData:listingCollections[0] })
        // await createNFTs({strapi, collectionEntry})

      await Promise.all(createCollectionPromises)
      } catch (error) {
          console.log(555,error.message);
      }
     
      
  }

  const getNFTMetadata =  (url) => {
   return  axios.get(url).then((response) => response.data);
  }

  const deleteCollectionsAndNFTsForTest = async ({strapi}) => {
    const collections = await strapi.entityService.findMany('api::collection.collection');

    await strapi.db.query("api::collection.collection").deleteMany({
      where: {
        $or: collections.map(_ => ({
          id: _.id
        }))
      },
    });

    const nfts = await strapi.entityService.findMany('api::nft.nft');

    await strapi.db.query("api::nft.nft").deleteMany({
      where: {
        $or: nfts.map(_ => ({
          id: _.id
        }))
      },
    }); 

    console.log("Deleted All Collections and NFTs")

  }


  module.exports = {
    addCollelctions
  }
