const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Manually warn a user (increments warning count)')
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to use this.', ephemeral: true });
    }
    const member = await interaction.guild.members.fetch(interaction.options.getUser('user', true).id);
    const reason = interaction.options.getString('reason', true);

    const key = `${interaction.guildId}-${member.id}`;
    const count = (ctx.userWarnings.get(key) || 0) + 1;
    ctx.userWarnings.set(key, count);

    await ctx.moderationActions.warnMember(interaction.guild, member, reason, count, interaction.channel);
    return interaction.reply({ content: `Warned ${member.user.tag}. Warning count: ${count}`, ephemeral: true });
  }
};
