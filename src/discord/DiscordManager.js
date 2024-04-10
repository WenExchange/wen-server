const { discordClient } = require("./DiscordClient");
const { EmbedBuilder } = require("discord.js");
let instance = null;
const DISCORD_INFO = {
  GUILD_ID: "1205136052289806396",
  CHANNEL: {
    LISTING_COLLECTION: "1219606689918222336",
    DETECTING_COLLECTION: "1220181262409535519",
    LISTING_NFT: "1220172329309573202",
    YIELD: "1212042486785245214",
    ERROR_LOG: "1227126471462490112"
  }
};
module.exports = class DiscordManager {
  constructor(strapi) {
    this.strapi = strapi;
    /** Constants */

    /** Discord Client */
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new DiscordManager(strapi);
    }
    return instance;
  }

  /** Controller */

  async getGuild(guildId) {
    try {
      const guild = await discordClient.guilds.fetch(guildId);
      return guild;
    } catch (error) {
      throw error;
    }
  }

  async getChannel({ guild, channelId }) {
    try {
      const _guild = await guild.channels.fetch(channelId);
      return _guild;
    } catch (error) {
      throw error;
    }
  }

  async getMember({ guild, userId }) {
    try {
      const member = await guild.members.fetch(userId);
      return member;
    } catch (error) {
      throw error;
    }
  }


  /** Create Embed */

  getEmbed = (embedData) => {
    try {
      const embed = new EmbedBuilder()
        .setDescription(embedData.embeds[0].description)
        .setFooter({
          text: embedData.embeds[0].footer.text,
          iconURL: embedData.embeds[0].footer.icon_url,
        });

      return embed;
    } catch (error) {
      return null;
    }
  };
  
  /** Send Messages */
  async logWenBotDiscordChannel({  data }) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID)
    const channelId = DISCORD_INFO.CHANNEL.YIELD
    
    const embed = new EmbedBuilder()
    .setColor(0x4aff36)
    .setTitle('Just Claimed Blast Native Yield!🌾')
    .setImage('https://d1kb1oeulsx0pq.cloudfront.net/banner_67fc7cc3dc.jpeg')
    .setTimestamp()
    .addFields(
      { name: 'Claimed ETH', value: `${data.claimedETH} ETH` },
      { name: 'Used Gas', value: `${data.claimedETH} ETH` },
      { name: 'Wen Trade Pool Balance', value: `${data.contractEthBalance} ETH` },
      { name: 'Transaction', value: `https://testnet.blastscan.io/tx/${data.txHash}` },
    )
    .setFooter({
      text: "Powered by Wen Exchange",
      iconURL: "https://d1kb1oeulsx0pq.cloudfront.net/logo_64eb3dad15.png",
    });

    const trackerChannel = await this.getChannel({
      guild,
      channelId,
    })
    trackerChannel.send({ embeds: [embed] });
  }

  async logDetectingCollection(createdCollection) {
    try {
      const guild = await this.getGuild(DISCORD_INFO.GUILD_ID);
      const channelId = DISCORD_INFO.CHANNEL.DETECTING_COLLECTION;
      const embed = new EmbedBuilder()
        .setColor(0x4aff36)
        .setTitle("Detection of New Collection")
        .setTimestamp()
        .addFields(
          { name: "Collection Name", value: `${createdCollection.name}` },
          {
            name: "Contract Address",
            value: `${createdCollection.contract_address}`
          },
          {
            name: "Creator Address",
            value: `${createdCollection.creator_address}`
          },
          { name: "Type", value: createdCollection.token_type }
        )
        .setFooter({
          text: "Powered by Wen Exchange",
          iconURL: "https://d1kb1oeulsx0pq.cloudfront.net/logo_64eb3dad15.png"
        });
      const trackerChannel = await this.getChannel({
        guild,
        channelId
      });
      trackerChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error.message);
    }
  }

  async logListingCollectionPublish(collection) {
    try {
      const guild = await this.getGuild(DISCORD_INFO.GUILD_ID);
      const channelId = DISCORD_INFO.CHANNEL.LISTING_COLLECTION;

      const embed = new EmbedBuilder()
        .setColor(0x4aff36)
        .setTitle("Listing of New Collection")
        .setTimestamp()
        .addFields(
          { name: "Collection Name", value: `${collection.name}` },
          {
            name: "Contract Address",
            value: `${collection.contract_address}`
          },
          {
            name: "Creator Address",
            value: `${collection.creator_address}`
          },
          { name: "Type", value: collection.token_type }
        )
        .setFooter({
          text: "Powered by Wen Exchange",
          iconURL: "https://d1kb1oeulsx0pq.cloudfront.net/logo_64eb3dad15.png"
        });

      const trackerChannel = await this.getChannel({
        guild,
        channelId
      });
      trackerChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error.message);
    }
  }

  async logListingCollectionError({ error, collection }) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID);
    const channelId = DISCORD_INFO.CHANNEL.DETECTING_COLLECTION;

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTimestamp()
      .addFields(
        { name: "Error Message", value: `${error.message}` },
        {
          name: "Details",
          value: `${JSON.stringify(collection)}`
        }
      );

    const trackerChannel = await this.getChannel({
      guild,
      channelId
    });
    trackerChannel.send({ embeds: [embed] });
  }

  async logListingNFT({ collection, createdNFT }) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID);
    const channelId = DISCORD_INFO.CHANNEL.LISTING_NFT;

    const trackerChannel = await this.getChannel({
      guild,
      channelId
    });
    trackerChannel.send(
      `[Listing of New NFT] ${collection.name} - ${createdNFT.name}`
    );
  }

  async logListingNFTError({ collection, tokenId, error }) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID);
    const channelId = DISCORD_INFO.CHANNEL.LISTING_NFT;
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTimestamp()
      .addFields(
        {
          name: "Collection",
          value: `${collection.id} - ${collection.name} - ${collection.contract_address}`
        },
        {
          name: "Token",
          value: `${tokenId}`
        },
        { name: "Error details", value: `${error.message}` }
      );
    const trackerChannel = await this.getChannel({
      guild,
      channelId
    });
    trackerChannel.send({ embeds: [embed] });
  }

  async logError({ error, identifier }) {
    try {
      const guild = await this.getGuild(DISCORD_INFO.GUILD_ID);
    const channelId = DISCORD_INFO.CHANNEL.ERROR_LOG;
    
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTimestamp()
      .addFields(
        { name: "Identifier", value: `${identifier}` },
        { name: "Details", value: `${error?.message}` }
      );
    const trackerChannel = await this.getChannel({
      guild,
      channelId
    });
    trackerChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error(error.message)
    }
    
  }



  
};




