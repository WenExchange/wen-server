module.exports = {
  routes: [
    {
     method: 'POST',
     path: '/early-access/addEarlyUser',
     handler: 'early-access.addEarlyUser',
     config: {
       policies: [],
       middlewares: [
        "plugin::users-permissions.rateLimit",
       ],
     },
    },
    {
      method: 'GET',
      path: '/early-access/authTwitter',
      handler: 'early-access.authTwitter',
      config: {
        policies: [],
        middlewares: [
          "plugin::users-permissions.rateLimit",
        ],
      },
     },
     {
      method: 'GET',
      path: '/early-access/followTwitter',
      handler: 'early-access.followTwitter',
      config: {
        policies: [],
        middlewares: [
          "plugin::users-permissions.rateLimit",
        ],
      },
     },
     {
      method: 'GET',
      path: '/early-access/addUserToDiscord',
      handler: 'early-access.addUserToDiscord',
      config: {
        policies: [],
        middlewares: [
          "plugin::users-permissions.rateLimit",
        ],
      },
     },
     {
      method: 'GET',
      path: '/early-access/checkIsMemberOfDiscord',
      handler: 'early-access.checkIsMemberOfDiscord',
      config: {
        policies: [],
        middlewares: [
          "plugin::users-permissions.rateLimit",
        ],
      },
     },
  ],
};
