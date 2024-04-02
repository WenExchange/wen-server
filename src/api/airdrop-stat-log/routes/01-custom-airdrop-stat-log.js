


module.exports = {
    routes: [

      { // Path defined with an URL parameter
        method: 'GET',
        path: '/airdrop-stat-log/dashboard',
        handler: 'airdrop-stat-log.getSpringAirdropDashboardData',
      },
    ]
  }