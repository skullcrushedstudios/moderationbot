const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getthresholds')
    .setDescription('Show current AI moderation thresholds'),
  async execute(interaction, ctx) {
    const t = ctx.aiModeration.getThresholds();
    const embed = new EmbedBuilder()
      .setColor('#1E90FF')
      .setTitle('Current Thresholds')
      .setDescription(`toxicity: ${t.toxicity.toFixed(2)}\nspam: ${t.spam.toFixed(2)}\nharassment: ${t.harassment.toFixed(2)}`)
      .setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
