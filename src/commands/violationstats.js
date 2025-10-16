const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('violationstats')
    .setDescription('Show today\'s violation statistics'),
  async execute(interaction, ctx) {
    await interaction.deferReply({ ephemeral: true });
    const stats = await ctx.logger.getViolationStats();

    const types = Object.entries(stats.types).map(([k,v]) => `${k}: ${v}`).join('\n') || 'None';
    const topUsers = Object.entries(stats.users)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([id,count]) => `<@${id}>: ${count}`)
      .join('\n') || 'None';

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('Violation Stats (Today)')
      .addFields(
        { name: 'Total', value: String(stats.total), inline: true },
        { name: 'By Type', value: types, inline: false },
        { name: 'Top Users', value: topUsers, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
