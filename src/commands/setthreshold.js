const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setthreshold')
    .setDescription('Adjust AI moderation thresholds (admin only)')
    .addStringOption(opt => opt
      .setName('category')
      .setDescription('Which threshold to adjust')
      .setRequired(true)
      .addChoices(
        { name: 'toxicity', value: 'toxicity' },
        { name: 'spam', value: 'spam' },
        { name: 'harassment', value: 'harassment' }
      )
    )
    .addNumberOption(opt => opt
      .setName('value')
      .setDescription('New threshold value (0.0-1.0)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(1)
    ),
  async execute(interaction, ctx) {
    // Admin gate
    if (!(interaction.memberPermissions?.has(PermissionFlagsBits.Administrator))) {
      return interaction.reply({ content: 'Only administrators can change thresholds.', ephemeral: true });
    }

    const category = interaction.options.getString('category', true);
    const value = interaction.options.getNumber('value', true);

    const ok = ctx.aiModeration.setThreshold(category, value);
    if (!ok) {
      return interaction.reply({ content: 'Invalid category or value.', ephemeral: true });
    }

    const t = ctx.aiModeration.getThresholds();
    const embed = new EmbedBuilder()
      .setColor('#1E90FF')
      .setTitle('Threshold Updated')
      .addFields(
        { name: 'Category', value: category, inline: true },
        { name: 'New Value', value: value.toFixed(2), inline: true },
        { name: 'Current Thresholds', value: `toxicity: ${t.toxicity.toFixed(2)}\nspam: ${t.spam.toFixed(2)}\nharassment: ${t.harassment.toFixed(2)}` }
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
