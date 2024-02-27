
const Moralis = require("moralis").default;
require("dotenv").config();

const startMoralis = () => {
  Moralis.start({
    apiKey:
      process.env.MORALIS_API_KEY
  }).catch((err) => {
    console.log(err.message);
  });
};

startMoralis()

