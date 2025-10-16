const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Show warning count for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to use this.', ephemeral: true });
    }
    const user = interaction.options.getUser('user', true);
    const key = `${interaction.guildId}-${user.id}`;
    const count = ctx.userWarnings.get(key) || 0;
    return interaction.reply({ content: `${user.tag} has ${count} warning(s).`, ephemeral: true });
  }
};
