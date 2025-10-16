const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for this channel (seconds)')
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need Manage Channels to use this.', ephemeral: true });
    }
    const seconds = interaction.options.getInteger('seconds', true);
    await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
    return interaction.reply({ content: `Slowmode set to ${seconds}s for ${interaction.channel}.`, ephemeral: true });
  }
};
