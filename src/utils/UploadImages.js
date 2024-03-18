const axios = require("axios");
const { parse } = require("url");
const {API_TOKEN, IPFS} = require("./constants")
const fs = require('fs');

async function uploadNFTImageWithFile({ strapi }) {
  console.log(333);
  try {

    const nftDatas = await strapi.db.query("api::nft.nft").findMany({
      where: {
        // collection: {
        //   id: {
        //     $notNull: true
        //   }
        // },
        image_url: {
          $notContainsi: 'https://d1kb1oeulsx0pq.cloudfront.net/',
        }
      },
      orderBy: { token_id: "asc" }, 
      // populate: { collection: true },
      // offset: 0,
      // limit: 1
    });

    // console.log(333, "nftDatas",nftDatas);
    fs.writeFile('./src/utils/willUpdateImageData.json', JSON.stringify(nftDatas, null, 2), (err) => {
      if (err) throw err;
      console.log('filteredUploadedInfoList.json has been saved.');
    });
    return
    const uploadPromises = nftDatas.map(nftData => {
      return axios({
        method: "GET",
        url: nftData.image_url,
        responseType: "blob",
  
      }).then(response => {
        return new Blob([response.data], { type: 'image/png' });
      }).then(blob => {
        const form = new FormData();
        form.append('files', blob, `${nftData.contractAddress}-${nftData.token_id}.png`);
        return axios({
          method: "POST",
          url: "http://127.0.0.1:1337/api/upload",
          data: form,
          headers: {
            authorization: `Bearer ${API_TOKEN.UPLOAD}`,
          },
        }).then(res => {
          
         return {
           contract_address: nftData.contractAddress,
           token_id: nftData.token_id,
           image_url: res.data[0].url
         }
        })
      }).catch(e => {
        console.log(333, e.message);
        return null
      })

    })

    const uploadedInfoList = await Promise.all(uploadPromises)
    const filteredUploadedInfoList = uploadedInfoList.filter(_ => _ !== null)
    console.log(333, "filteredPploadedInfoList",filteredUploadedInfoList);
    fs.writeFile('filteredUploadedInfoList.json', JSON.stringify(filteredUploadedInfoList, null, 2), (err) => {
      if (err) throw err;
      console.log('filteredUploadedInfoList.json has been saved.');
    });
    // for (let i = 0; i < filteredPploadedInfoList.length; i++) {
    //   const willUpdateNFTInfo = filteredPploadedInfoList[i];

    //   // const updatedNFT = await strapi.db.query("api::nft.nft").update({
    //   //   where: { 
    //   //     $and: [
    //   //       {token_id: willUpdateNFTInfo.token_id},
    //   //       {collection: {
    //   //         contract_address: willUpdateNFTInfo.contract_address
    //   //       }}
    //   //     ]
    //   //   },
    //   //   data: {
    //   //     image_url: willUpdateNFTInfo.image_url
    //   //   },
    //   // });


    //   const updatedNFT = await strapi.db.query("api::nft.nft").findOne({
    //     where: { 
    //       $and: [
    //         {token_id: willUpdateNFTInfo.token_id},
    //         {collection: {
    //           contract_address: willUpdateNFTInfo.contract_address
    //         }}
    //       ]
    //     },
    //     data: {
    //       image_url: willUpdateNFTInfo.image_url
    //     },
    //   });

    //   console.log(333, "updatedNFT",updatedNFT.name);


      
    // }
  } catch (error) {
    console.error(error.message
      );
    // ctx.throw(500, "Unable to upload image from URL");
  }
}

async function updateNFT({strapi}) {
  
  const filteredUploadedInfoList  = require("./filteredUploadedInfoList.json")
  for (let i = 0; i < filteredUploadedInfoList.length; i++) {
      const willUpdateNFTInfo = filteredUploadedInfoList[i];

      const updatedNFT = await strapi.db.query("api::nft.nft").update({
        populate: {
          collection: true
        },
        where: { 

          $and: [
            {token_id: willUpdateNFTInfo.token_id},
            {collection: {
              contract_address: willUpdateNFTInfo.contract_address
            }}
          ]
        },
        data: {
          image_url: willUpdateNFTInfo.image_url
        }
      }, );


   

      console.log(333, "updatedNFT",updatedNFT.name);
}
}

// uploadNFTImageWithFile({strapi: null})


async function updateNFTImageURL({strapi}) {
  
  const nftDatas = await strapi.db.query("api::nft.nft").findMany({
    where: {
      image_url: {
        $contains: "quicknode"
      },
    }
  });

  console.log(333, nftDatas.length);
  // return

  // const filteredUploadedInfoList  = require("./filteredUploadedInfoList.json")
  for (let i = 0; i < nftDatas.length; i++) {
      const willUpdateNFTInfo = nftDatas[i];
      
      if (!willUpdateNFTInfo.image_url.startsWith("https://wen-exchange.quicknode-ipfs.com/ipfs/")) continue
      const updatedNFT = await strapi.entityService.update("api::nft.nft",willUpdateNFTInfo.id,{
        data: {
          image_url: willUpdateNFTInfo.image_url.replace('https://wen-exchange.quicknode-ipfs.com/ipfs/', IPFS.GATEWAY_URL)
        }
      }, );


   

      console.log(333, "updatedNFT",updatedNFT.name);
}
}

module.exports = {
  uploadNFTImageWithFile,
  updateNFT,
  updateNFTImageURL
};
