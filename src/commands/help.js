const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List available bot commands and usage'),
  async execute(interaction) {
    const help = [
      '**AI / Moderation**',
      '/analyze text:<text>',
      '/automod status:<on|off>',
      '/getthresholds',
      '/setthreshold category:<toxicity|spam|harassment> value:<0-1>',
      '/settimeout minutes:<n>',
      '/status',
      '/scan count:<n>',
      '',
      '**Blocklist**',
      '/blockword add word:<word or phrase>',
      '/blockword addmany words:<multi-line list>',
      '/blockword remove word:<word>',
      '/blockword list',
      '',
      '**Manual Actions**',
      '/warn user:<@user> reason:<text>',
      '/timeout user:<@user> minutes:<n> reason:<text?>',
      '/kick user:<@user> reason:<text?>',
      '/ban user:<@user> reason:<text?>'
    ].join('\n');

    return interaction.reply({ content: help, ephemeral: true });
  }
};
