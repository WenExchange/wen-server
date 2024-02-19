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
  logUpdateRolDiscordChannel({ guild, channelId, discordId, tier }) {
    if (!channelId) return;
    if (!guild) return;
    if (!discordId) return;

    const embed = this.getEmbed({
      embeds: [
        {
          description: `🐱 MEOW, <@${discordId}> has been updated to **${tier.title}**`,
          footer: {
            text: "Powered by SeiRoboCat",
            icon_url:
              "https://d39vv1wnkaoyb6.cloudfront.net/logo_f2c0a836c6.jpeg",
          },
        },
      ],
    });
    this.getChannel({
      guild,
      channelId,
    }).then((trackerChannel) => {
      if (trackerChannel) {
        trackerChannel.send({ embeds: [embed] });
      }
    });
  }
};
