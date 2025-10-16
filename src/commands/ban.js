const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user (manual)')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need ban permissions to use this.', ephemeral: true });
    }
    const member = await interaction.guild.members.fetch(interaction.options.getUser('user', true).id);
    const reason = interaction.options.getString('reason') || 'Manual ban';
    const ok = await ctx.moderationActions.banMember(interaction.guild, member, reason);
    return interaction.reply({ content: ok ? `Banned ${member.user.tag}.` : 'Failed to ban (check bot permissions/roles).', ephemeral: true });
  }
};
