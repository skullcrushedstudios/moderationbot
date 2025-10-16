const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settimeout')
    .setDescription('Set the default timeout duration (minutes) for the bot')
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(10080)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to use this.', ephemeral: true });
    }
    const minutes = interaction.options.getInteger('minutes', true);
    const ok = ctx.moderationActions.setTimeoutMinutes(minutes);
    return interaction.reply({ content: ok ? `Default timeout set to ${minutes} minutes.` : 'Invalid value.', ephemeral: true });
  }
};
