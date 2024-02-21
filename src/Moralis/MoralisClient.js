
const Moralis = require("moralis").default;
require("dotenv").config();

const startMoralis = () => {
  Moralis.start({
    apiKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjJiZTNlMmU5LWE4YzctNGVhYS04ODcxLWYzYWE3OWMzYmQyNiIsIm9yZ0lkIjoiMzc4Mjc2IiwidXNlcklkIjoiMzg4NzI2IiwidHlwZUlkIjoiODhjNDQzYWUtNTRhZS00ZGNkLThmZGYtOTI0YzdkM2Q5ZDQ5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MDg0Mzg0ODMsImV4cCI6NDg2NDE5ODQ4M30.MRQ8gdICGA2ct3ddshshTzseyYTHGnkyj9eKhk-KJQ0"
  }).catch((err) => {
    console.log(err.message);
  });
};

startMoralis()

