"use strict";
const { ethers } = require("ethers");
const slugify = require("slugify");
const voucher_codes = require("voucher-code-generator");
const { isEthereumAddress, isTwitterLink, isDiscordLink, isLink } = require("../../../utils/helpers");

/**
 * collection controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::collection.collection",
  ({ strapi }) => ({

    async getFindOneCollection(ctx) {
      {
        try {
          const { slug, contract_address, is_populate = false } = ctx.request.query;

          const filters = []
          if (slug) filters.push({
            slug
          })
          if (contract_address) filters.push({
            contract_address
          })

          const populate = is_populate ? {
            nfts: {
              sell_order: true
            }
          } : null

          const collection = await strapi.db
            .query("api::collection.collection")
            .findOne({
              where: {
                $and: [
                  ...filters,
                  {
                    publishedAt: {
                      $notNull: true
                    }
                  }
                ]
              },
              populate
            });
          if (!collection) throw new Error("Not found")


          return ctx.body = collection
        } catch (error) {
          console.error(error.message)
        }
      }
    },

    async updateCollectionByOwner(ctx) {
      try {
        let { signature, address, message,
          name,
          description,
          logo_url,
          banner_url,
          royalty_fee_point,
          royalty_fee_receiver,
          twitter,
          discord,
          website,
          slug
        } = ctx.request.body.data;
        
        const recoveredAddress = ethers.utils.verifyMessage(
          message,
          signature
        );

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          return (ctx.body = {
            success: false,
            message: "Signature verification failed.",
          });
        }

        const collection = await strapi.db.query("api::collection.collection").findOne({
          where: {
            slug,
            publishedAt: {
              $notNull: true,
            }
          }
        })

        if (!collection) {
          return (ctx.body = {
            success: false,
            message: "Not Found Collection",
          });
        }
        const AdminAddresses = ["0x94fe00c36c6B94f1CA31bc8cC28483248BB0B39A"].map(a => a.toLowerCase())
        const wl = [...AdminAddresses,collection.creator_address.toLowerCase() ]
        if (!wl.includes(address.toLowerCase())) {
          return (ctx.body = {
            success: false,
            message: "Invalid Permissions",
          });
        }

        
       

        const rawTextInName = name.replaceAll(" ", "")
        const isValidName = rawTextInName.length >= 2
        const slugName = slugify(`${name}`, {
          lower: true,
          remove: /[*+~.()'"!:@]/g,
          strict: true
        });
        const slugId = voucher_codes.generate({
          length: 4,
          count: 1,
          charset: "0123456789abcdefghijklmnopqrstuvwxyz"
        })[0];
        

        let newSlug = collection.name !== name ? `${slugName}-${slugId}` : null

        const isValidDescription = description.length <= 500 || description === ""

        const numberedRoyaltyPoint = Number(royalty_fee_point)
        const isValidRoyaltyPoint = !Number.isNaN(numberedRoyaltyPoint) && numberedRoyaltyPoint >= 0 && numberedRoyaltyPoint <= 50 * 100

        const isValidRoyaltyReceiver = isEthereumAddress(royalty_fee_receiver) || royalty_fee_receiver === ""
        const isValidTwitter = isTwitterLink(twitter) || twitter === ""
        const isValidDiscord = isDiscordLink(discord) || discord === ""
        const isValidWebsite = isLink(website) || website === ""

        if (!isValidName || !isValidDescription || !isValidRoyaltyPoint || !isValidRoyaltyReceiver || !isValidTwitter || !isValidDiscord || !isValidWebsite) {
          return (ctx.body = {
            success: false,
            message: "Parameter Validation Error",
          });
        }

        const data = {}
        if (collection.name !== name) {
          data.name = name
          data.slug = newSlug
        }

        if (collection.description !== description) data.description = description
        if (collection.logo_url !== logo_url) data.logo_url = logo_url
        if (collection.banner_url !== banner_url) data.banner_url = banner_url
        if (Number(collection.royalty_fee_point) !== Number(royalty_fee_point)) data.royalty_fee_point = Number(royalty_fee_point)
        if (collection.royalty_fee_receiver !== royalty_fee_receiver) data.royalty_fee_receiver = royalty_fee_receiver
        if (collection.twitter !== twitter) data.twitter = twitter
        if (collection.discord !== discord) data.discord = discord
        if (collection.website !== website) data.website = website

        const updatedCollection = await strapi.db.query("api::collection.collection").update({
          where: {
            slug
          },
          data
        })

        if (!updatedCollection) {
          throw new Error("not updated")
        }
        return (ctx.body = {
          success: true,
          collection: updatedCollection
        });

      } catch (error) {
        strapi.log.error(error.message)
        return (ctx.body = {
          success: false,
          message: "Internal server error"
        });
      }
    }
  })

);
