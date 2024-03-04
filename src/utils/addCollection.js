
const listingCollections = require("./listing_collections.json")
const axios = require("axios")

  const addCollelctions = async ({strapi}) => {
      try {
        const promises = listingCollections.map(collectionData => {
            return strapi.entityService.create('api::collection.collection', {
                data: {
                  ...collectionData,

                },
              })
              .then(collectionEntry => {
                  console.log(333, "collectionEntry",collectionEntry);
                const nftMetadataPromises =[...Array(Number(collectionData.total_supply)).keys()].map(value => {
                    return getNFTMetadata(`${collectionData.token_uri}/${value}`)
                })

                return Promise.all(nftMetadataPromises).then(metadatas => {
                    const nftDatas = metadatas.map((metadata, index) => {
                        let image_url = metadata?.image || ""
                        // ipfs 변환
                        return {
                            collection: collectionEntry.id,
                            name: metadata?.name || `${collectionData.nft_name} #${index}`,
                            image_url,
                            token_id: index,
                            attributes: metadata?.attributes || null
                        }
                    })
                    // bulk cretate
                    return strapi.db.query("api::nft.nft").createMany({
                        data: nftDatas,
                      });
                } )
              })
        })


        // const promises = listingCollections.map(collectionData => {
        //     const nftMetadataPromises =[...Array(Number(collectionData.total_supply)).keys()].map(value => {
        //         return getNFTMetadata(`${collectionData.token_uri}/${value}`)
        //     })

        //     return Promise.all(nftMetadataPromises).then(metadatas => {
        //         const nftCreatePromises = metadatas.map((metadata, index) => {
        //             console.log(444, {
        //                 // collection: collectionEntry.id,
        //                 name: metadatas?.name || `${collectionData.nft_name} #${index}`,
        //                 image_url: metadata?.image || "",
        //                 token_id: index,
        //                 attributes: metadata?.attributes || null
        //             });
        //             return {
        //                 // collection: collectionEntry.id,
        //                 name: metadatas?.name || `${collectionData.nft_name} #${index}`,
        //                 image_url: metadata?.image || "",
        //                 token_id: index,
        //                 attributes: metadata?.attributes || null
        //             }
        //         })
        //     } )
        // })


        const results = await Promise.all(promises)
        console.log(333, "results",results);
      } catch (error) {
          console.log(555,error.message);
      }
     
      
  }

  const getNFTMetadata =  (url) => {
   return  axios.get(url).then((response) => response.data);
  }


  module.exports = {
    addCollelctions
  }
