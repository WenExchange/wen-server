module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: "https://d1kb1oeulsx0pq.cloudfront.net",
        // rootPath: env('CDN_ROOT_PATH'),
        s3Options: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_ACCESS_SECRET'),
            region: env('AWS_REGION'),
            params: {
            //   ACL: env('AWS_ACL', 'public-read'),
            //   signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
              Bucket: env('AWS_BUCKET_NAME'),
            },
          },
      },
      // These parameters could solve issues with ACL public-read access — see [this issue](https://github.com/strapi/strapi/issues/5868) for details
      actionOptions: {
        upload: {
          ACL: null
        },
        uploadStream: {
          ACL: null
        },
      }
    },
  },
  "users-permissions": {
    config: {
      ratelimit: {
        interval: 1000 * 60, // 1 minutes 
        max: 100,  // 100 call
      },
    },
  },
  "import-export-entries": {
    enabled: true,
  },
  transformer: {
    enabled: true,
    config: {
      responseTransforms: {
        removeAttributesKey: true,
        removeDataKey: true,
      },
      requestTransforms: {
        wrapBodyWithDataKey: true,
      },
    },
  },
  // "strapi-content-type-explorer": {
  //   enabled: true,
  //   resolve: "./src/plugins/strapi-content-type-explorer",
  // },

  // Step 1: Configure the redis connection
        // @see https://github.com/strapi-community/strapi-plugin-redis
      //   redis: {
      //     config: {
      //         connections: {
      //             default: {
      //                 connection: {
      //                     host: '127.0.0.1',
      //                     port: 6379,
      //                     db: 0,
      //                 },
      //                 settings: {
      //                     debug: true,
      //                 },
      //             },
      //         },
      //     },
      // },
      // Step 2: Configure the redis cache plugin
      "rest-cache": {
          config: {
            provider: {
              name: 'memory',
              getTimeout: 500,
              options: {
                // The maximum size of the cache
                max: 32767,
                // Update to the current time whenever it is retrieved from cache, causing it to not expire
                updateAgeOnGet: false,
                // ...
              },
            },
              strategy: {
                debug: false,
                  enableEtagSupport: false,
                  logs: true,
                  clearRelatedCache: true,
                  resetOnStartup: false,
                  maxAge:  60 * 60 * 1000,
                  contentTypes: [
                      // list of Content-Types UID to cache
                      {
                        contentType:"api::collection.collection",
                        maxAge: 10 * 60 * 1000,
                    },

                    "api::featured-item.featured-item",

                      {
                          contentType:  "api::airdrop-stat-log.airdrop-stat-log",
                          routes:[
                            {
                              path: '/api/airdrop-stat-log/leaderboard', // note that we set the /api prefix here
                              method: 'GET', // can be omitted, defaults to GET
                            },
                          ],
                      },
                      {
                          contentType:  "api::coin-price.coin-price",
                          maxAge: 15 * 60 * 1000,
                      },
                  ],
              },
          },
      },

});