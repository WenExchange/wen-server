


module.exports = {
    routes: [
      { // Path defined with an URL parameter
        method: 'GET',
        path: '/order/check',
        handler: 'order.checkValidOrderAndUpdate',
      },
    ]
  }