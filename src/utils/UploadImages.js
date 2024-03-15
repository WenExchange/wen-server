const axios = require("axios");
const { parse } = require("url");

async function uploadImage() {
  // const file = await blobFrom("./1.png", "image/png");
  // const form = new FormData();
  // form.append("files", file, "1.png");
  // const response = await fetch("http://localhost:1337/api/upload", {
  //   method: "post",
  //   body: form,
  // });
}

async function uploadByUrl({ strapi }) {
  try {
    const url = "https://api.blastopians.io/1.png";
    const imageName = parse(url).pathname.split("/").pop();
    const response = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "binary");
    await strapi.plugins["upload"].services.upload.upload({
      data: {},
      files: {
        path: buffer,
        name: imageName,
        type: response.headers["content-type"],
      },
    });
    // ctx.send({ message: "Image uploaded successfully!" });
  } catch (error) {
    // ctx.throw(500, "Unable to upload image from URL");
  }
}

async function uploadNFTImages({ strapi }) {
  const imageURL = "https://api.blastopians.io/1.png";
  const myImage = await fetch(imageURL);
  const myBlob = await myImage.blob();

  // const formData = new FormData();
  // formData.append("files", myBlob, imageURL);
  // // formData.append("ref", "api::event.event");
  // // formData.append("refId", eventId);
  // formData.append("field", "image/png");
  // // console.log(formData);
  // // const response = await fetch("http://localhost:1337/api/upload", {
  // //   method: "post",
  // //   body: formData,
  // // });

  // const response = await axios({
  //   method: "GET",
  //   url: imageURL,
  //   responseType: "arraybuffer",
  // });

  const arrayBuffer = await myBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const formData = new FormData();
  formData.append("files", buffer);
  formData.append("name", "hehe");

  await strapi.plugins.upload.services.upload.upload({
    data: {
      fileInfo: {
        name: "Name",
        caption: "Caption",
        alternativeText: "Alternative Text",
      },
    },
    files: formData,
  });
  // await strapi.query("plugin::upload.file").create({ data: buffer });
  // console.log(response);
}

async function uploadByUrl(imageUrls) {
  try {
    const formData = new FormData();

    for (let imageUrl of imageUrls) {
      const image = await fetch(imageUrl);
      const imagetoUpload = await image.blob();
      formData.append("files", imagetoUpload);
    }

    const uploadedBlobToStrapi = await fetch(
      "http://localhost:1337/api/upload",
      {
        method: "POST",
        headers: {
          authorization: `Bearer 8fb15f482edd0150963bc7cb8d7ef28431a8fa89fe7307a98faec92cea0d59b0bf0637264c883dd5ba83f205f1e486698ebb677ad650bb8c6d14d4ac951522061d5abd1f70527138a5875638f80e35ac68ce3af6c7b9c96bca37ace9d3528f8b5d87d545d5eca5cca8f8748f7d1202e2debe60076048d17dab64bd35aaeaf3c1`,
        },
        body: formData,
      }
    );
    const results = await uploadedBlobToStrapi.json();
    // console.log(results);
    return results;
  } catch (error) {
    console.log(error);
    console.log(error.message);
  }
}
const fs = require("fs").promises;
const path = require("path");

// Assuming uploadByUrl function is defined as shown earlier

async function processAndUploadImages() {
  const filePath = path.join(__dirname, "48_1.json");
  let data = await fs.readFile(filePath, "utf8");
  let objects = JSON.parse(data);

  const objectsToProcess = objects.filter((obj) => !obj.strapi_image_url);

  // Processing in batches of 10
  for (let i = 0; i < objectsToProcess.length; i += 10) {
    const batch = objectsToProcess.slice(i, i + 10);
    console.log("batch : ", i, i + 10);
    const imageUrls = batch.map((obj) =>
      obj.image_url.replace(
        "ipfs://",
        "https://wen-exchange.quicknode-ipfs.com/ipfs/"
      )
    ); // Convert IPFS URL to HTTP URL

    // Upload images by URL and update objects with returned URLs
    const uploadResults = await uploadByUrl(imageUrls);
    if (uploadResults) {
      uploadResults.forEach((result, index) => {
        // Find original object and update strapi_image_url
        const originalIndex = objects.findIndex(
          (obj) => obj.image_url === batch[index].image_url
        );
        if (originalIndex !== -1) {
          objects[originalIndex].strapi_image_url = result.url;
        }
      });
    }
  }

  // Save the updated array back to "a.json"
  await fs.writeFile(filePath, JSON.stringify(objects, null, 2));
}

async function processAndUploadImagesIncrementally() {
  const filePath = path.join(__dirname, "48_1.json");

  for (;;) {
    // Infinite loop, will break when no more items to process
    let data = await fs.readFile(filePath, "utf8");
    let objects = JSON.parse(data);

    // Find first 10 objects without strapi_image_url
    const objectsToProcess = objects
      .filter((obj) => !obj.strapi_image_url)
      .slice(0, 30);

    // If there are no objects left to process, break the loop
    if (objectsToProcess.length === 0) {
      break;
    }

    const imageUrls = objectsToProcess.map((obj) =>
      obj.image_url.replace(
        "ipfs://",
        "https://wen-exchange.quicknode-ipfs.com/ipfs/"
      )
    ); // Convert IPFS URL to HTTP URL
    console.log("object start", objectsToProcess[0].token_id);

    // Upload images by URL and update objects with returned URLs
    const uploadResults = await uploadByUrl(imageUrls);

    if (uploadResults) {
      uploadResults.forEach((result, index) => {
        // Find original object and update strapi_image_url
        const originalIndex = objects.findIndex(
          (obj) => obj.image_url === objectsToProcess[index].image_url
        );
        if (originalIndex !== -1) {
          objects[originalIndex].strapi_image_url = result.url;
        }
      });

      // Save the partially updated array back to "a.json"
      await fs.writeFile(filePath, JSON.stringify(objects, null, 2));
    }
  }

  console.log("Image processing and upload complete.");
}
processAndUploadImagesIncrementally();

// async function processAndUploadImagesIncrementally2() {
//   const filePath = path.join(__dirname, "48_1.json");
//   let data = await fs.readFile(filePath, "utf8");
//   let objects = JSON.parse(data);
//   const batchSize = 200; // Processing in larger batches

//   for (let i = 0; i < objects.length; i += batchSize) {
//     const chunk = objects.slice(i, i + batchSize);
//     const objectsToProcess = chunk.filter((obj) => !obj.strapi_image_url);

//     if (objectsToProcess.length === 0) {
//       console.log(`Chunk starting at index ${i} has no items to process.`);
//       continue;
//     }

//     const imageUrls = objectsToProcess.map((obj) =>
//       obj.image_url.replace(
//         "ipfs://",
//         "https://wen-exchange.quicknode-ipfs.com/ipfs/"
//       )
//     );
//     const uploadPromises = imageUrls.map((url) => uploadByUrl([url])); // Assuming uploadByUrl can handle individual URLs
//     const uploadResults = await Promise.all(uploadPromises);

//     uploadResults.flat().forEach((result, index) => {
//       if (result && result.url) {
//         const originalIndex = objects.findIndex(
//           (obj) => obj.image_url === objectsToProcess[index].image_url
//         );
//         if (originalIndex !== -1) {
//           objects[originalIndex].strapi_image_url = result.url;
//         }
//       }
//     });

//     // Save the updated objects after processing this chunk
//     await fs.writeFile(filePath, JSON.stringify(objects, null, 2));
//     console.log(
//       `Chunk processed and saved. Last token_id in this chunk: ${
//         objectsToProcess[objectsToProcess.length - 1].token_id
//       }`
//     );
//   }

//   console.log("Image processing and upload complete.");
// }

module.exports = {
  uploadByUrl,
  uploadNFTImages,
};
