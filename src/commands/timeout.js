const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for X minutes (manual)')
    .addUserOption(o => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to use this.', ephemeral: true });
    }
    const member = await interaction.guild.members.fetch(interaction.options.getUser('user', true).id);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || 'Manual timeout';

    const ok = await ctx.moderationActions.timeoutMember(interaction.guild, member, reason, minutes);
    return interaction.reply({ content: ok ? `Timed out ${member.user.tag} for ${minutes}m.` : 'Failed to timeout (check bot permissions/roles).', ephemeral: true });
  }
};
