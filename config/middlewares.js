module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "dl.airtable.com",
            "wen-exchange.s3.ap-northeast-2.amazonaws.com",
            "d1kb1oeulsx0pq.cloudfront.net"
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "dl.airtable.com",
            "wen-exchange.s3.ap-northeast-2.amazonaws.com",
            "d1kb1oeulsx0pq.cloudfront.net"
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  // {
  //   name: 'strapi::ip',
  //   config: {
  //     whitelist: [],
  //     blacklist: [],
  //   },
  // },

  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // "global::debuglogger"
];
