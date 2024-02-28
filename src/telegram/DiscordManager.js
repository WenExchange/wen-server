const { discordClient } = require("./DiscordClient");
const { EmbedBuilder } = require("discord.js");
let instance = null;
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
    const guild = await this.getGuild("1205136052289806396")
    const channelId = "1212042486785245214"
    
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

  
};




