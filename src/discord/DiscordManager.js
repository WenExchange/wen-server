const { discordClient } = require("./DiscordClient");
const { EmbedBuilder } = require("discord.js");
let instance = null;
const DISCORD_INFO = {
  GUILD_ID: "1205136052289806396",
  CHANNEL: {
    LISTING: "1219606689918222336",
    YIELD: "1212042486785245214"
  }

}
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

  async logListingCollection(createdCollection) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID)
    const channelId = DISCORD_INFO.CHANNEL.LISTING
    
    const embed = new EmbedBuilder()
    .setColor(0x4aff36)
    .setTitle('Start Listing Process')
    .setTimestamp()
    .addFields(
      { name: 'id', value: createdCollection.id },
      { name: 'Contract Address', value: `${createdCollection.contract_address}` },
      { name: 'Creator Address', value: `${createdCollection.creator_address}` },
      { name: 'Collection Name', value: `${createdCollection.name}` },
      { name: 'Type', value: createdCollection.token_type },
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

  async logListingCollectionPublish(collection) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID)
    const channelId = DISCORD_INFO.CHANNEL.LISTING
    
    const embed = new EmbedBuilder()
    .setColor(0x4aff36)
    .setTimestamp()
    .setFooter({
      text: `${collection.name} is published`
    });

    const trackerChannel = await this.getChannel({
      guild,
      channelId,
    })
    trackerChannel.send({ embeds: [embed] });
  }


  async logListingCollectionError(error) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID)
    const channelId = DISCORD_INFO.CHANNEL.LISTING
    
    const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTimestamp()
    .setFooter({
      text: error.message
    });

    const trackerChannel = await this.getChannel({
      guild,
      channelId,
    })
    trackerChannel.send({ embeds: [embed] });
  }


  async logListingNFT({collection, createdNFT}) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID)
    const channelId = DISCORD_INFO.CHANNEL.LISTING

    const trackerChannel = await this.getChannel({
      guild,
      channelId,
    })
    trackerChannel.send(`${collection.name} - NFT listed ${createdNFT.name}`);
  }

  async logListingNFTError({collection, tokenId,error}) {
    const guild = await this.getGuild(DISCORD_INFO.GUILD_ID)
    const channelId = DISCORD_INFO.CHANNEL.LISTING

    const trackerChannel = await this.getChannel({
      guild,
      channelId,
    })
    trackerChannel.send(`[Listing NFT Error]\n ${collection.name} - NFT tokenId ${tokenId} - ${error.message}`);
  }



  
};




