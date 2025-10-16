const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetallwarnings')
    .setDescription('Reset all in-memory warnings for this guild (admin only)'),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can reset all warnings.', ephemeral: true });
    }
    let cleared = 0;
    for (const [key] of ctx.userWarnings) {
      if (key.startsWith(`${interaction.guildId}-`)) { ctx.userWarnings.delete(key); cleared++; }
    }
    return interaction.reply({ content: `Cleared ${cleared} warning entries for this guild.`, ephemeral: true });
  }
};
