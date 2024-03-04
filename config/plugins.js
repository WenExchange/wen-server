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
});