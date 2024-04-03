


module.exports = {
    routes: [

      { // Path defined with an URL parameter
        method: 'GET',
        path: '/airdrop-stat-log/dashboard',
        handler: 'airdrop-stat-log.getSpringAirdropDashboardData',
      },
      {
        method: 'GET',
        path: '/airdrop-stat-log/get-log',
        handler: 'airdrop-stat-log.getMyAirdropStatLog',
      },
      {
        method: 'GET',
        path: '/airdrop-stat-log/leaderboard',
        handler: 'airdrop-stat-log.getAirdropLeaderBoard',
      }


      
    ]
  }