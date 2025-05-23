


module.exports = {
    routes: [
      { // Path defined with an URL parameter
        method: 'POST',
        path: '/exchange-user/verify',
        handler: 'exchange-user.verifyAndCreateUser',
      },

      { // Path defined with an URL parameter
        method: 'POST',
        path: '/exchange-user/bridge',
        handler: 'exchange-user.earlyAccessBridge',
      },

      { // Path defined with an URL parameter
        method: 'GET',
        path: '/exchange-user/rank',
        handler: 'exchange-user.getEarlyAccessRank',
      },

      { // Path defined with an URL parameter
        method: 'POST',
        path: '/exchange-user/checkEligibilityAndClaimBox',
        handler: 'exchange-user.checkEligibilityAndClaimBox',
      },

      { // Path defined with an URL parameter
        method: 'POST',
        path: '/exchange-user/checkEligibilityAndClaimBox_Bidder',
        handler: 'exchange-user.checkEligibilityAndClaimBox_Bidder',
      },


      
    ]
  }