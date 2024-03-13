


module.exports = {
    routes: [
      { // Path defined with an URL parameter
        method: 'GET',
        path: '/nfts/getNFTs',
        handler: 'nft.getNFTs',
      },
      { // Path defined with an URL parameter
        method: 'GET',
        path: '/nfts/getNFT',
        handler: 'nft.getNFT',
      },
    ]
  }