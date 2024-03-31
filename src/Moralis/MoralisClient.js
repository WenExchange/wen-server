
const Moralis = require("moralis").default;
require("dotenv").config();

const startMoralis = () => {
  Moralis.start({
    apiKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjNmYWU3MjFlLTc0MmQtNDkyZS05Y2EwLTU0MzNkNjY0M2VkZCIsIm9yZ0lkIjoiMzc4Mjc2IiwidXNlcklkIjoiMzg4NzI2IiwidHlwZUlkIjoiODhjNDQzYWUtNTRhZS00ZGNkLThmZGYtOTI0YzdkM2Q5ZDQ5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTE3MTc4NDUsImV4cCI6NDg2NzQ3Nzg0NX0.xRloOdv3iusvPoArupFHF6c1Vn3oEl_pXUj2_Lc3TJA"
  }).catch((err) => {
    console.log(err.message);
  });
};

startMoralis()

