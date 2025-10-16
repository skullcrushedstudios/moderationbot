const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('registercommands')
    .setDescription('Force re-register slash commands (admin only)'),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can refresh commands.', ephemeral: true });
    }
    const cmds = Array.from(ctx.commands.values()).map(c => c.data.toJSON());
    try {
      const guild = interaction.guild;
      await guild.commands.set(cmds);
      return interaction.reply({ content: `Registered ${cmds.length} commands in this guild.`, ephemeral: true });
    } catch (e) {
      await ctx.client.application.commands.set(cmds);
      return interaction.reply({ content: `Registered ${cmds.length} commands globally.`, ephemeral: true });
    }
  }
};
