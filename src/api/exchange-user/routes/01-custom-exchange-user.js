


module.exports = {
    routes: [
      { // Path defined with an URL parameter
        method: 'POST',
        path: '/exchange-user/verify',
        handler: 'exchange-user.verifyAndCreateUser',
      },
    ]
  }