const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('analyze')
    .setDescription('Analyze arbitrary text with the AI moderation engine')
    .addStringOption(opt => opt
      .setName('text')
      .setDescription('Text to analyze')
      .setRequired(true)
    ),
  async execute(interaction, ctx) {
    const text = interaction.options.getString('text', true);
    await interaction.deferReply({ ephemeral: true });
    const analysis = await ctx.aiModeration.analyzeMessage(text);

    const embed = new EmbedBuilder()
      .setColor(analysis.violation ? '#FF6B35' : '#3CB371')
      .setTitle('AI Analysis Result')
      .addFields(
        { name: 'Violation', value: String(analysis.violation), inline: true },
        { name: 'Type', value: String(analysis.type || 'unknown'), inline: true },
        { name: 'Severity', value: (analysis.severity || 0).toFixed(2), inline: true },
        { name: 'Confidence', value: (analysis.confidence || 0).toFixed(2), inline: true },
        { name: 'Reason', value: analysis.reason || 'N/A', inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
