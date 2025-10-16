const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user (manual)')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need kick permissions to use this.', ephemeral: true });
    }
    const member = await interaction.guild.members.fetch(interaction.options.getUser('user', true).id);
    const reason = interaction.options.getString('reason') || 'Manual kick';
    const ok = await ctx.moderationActions.kickMember(interaction.guild, member, reason);
    return interaction.reply({ content: ok ? `Kicked ${member.user.tag}.` : 'Failed to kick (check bot permissions/roles).', ephemeral: true });
  }
};
