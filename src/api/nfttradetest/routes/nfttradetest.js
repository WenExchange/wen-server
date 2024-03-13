module.exports = {
  routes: [
    {
     method: 'POST',
     path: '/nfttradetest/list',
     handler: 'nfttradetest.list',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
