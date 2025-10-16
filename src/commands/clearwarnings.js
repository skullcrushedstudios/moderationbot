const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear warnings for a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to use this.', ephemeral: true });
    }
    const user = interaction.options.getUser('user', true);
    const key = `${interaction.guildId}-${user.id}`;
    ctx.userWarnings.delete(key);
    return interaction.reply({ content: `Cleared warnings for ${user.tag}.`, ephemeral: true });
  }
};
