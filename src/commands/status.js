const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show bot status and key settings'),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to view status.', ephemeral: true });
    }

    const t = ctx.aiModeration.getThresholds();
    const blockedCount = ctx.aiModeration.getBlockedWords().length;
    const auto = process.env.AUTO_MODERATE === 'true' ? 'On' : 'Off';
    const logCh = process.env.LOG_CHANNEL_ID && process.env.LOG_CHANNEL_ID !== 'your_log_channel_id_here' ? `<#${process.env.LOG_CHANNEL_ID}>` : 'not set';
    const embed = new EmbedBuilder()
      .setColor('#1E90FF')
      .setTitle('Bot Status')
      .addFields(
        { name: 'Auto-Moderation', value: auto, inline: true },
        { name: 'Timeout (default)', value: `${Math.floor(ctx.moderationActions.timeoutDuration/60000)} minutes`, inline: true },
        { name: 'Blocked Words', value: `${blockedCount}`, inline: true },
        { name: 'Thresholds', value: `toxicity: ${t.toxicity.toFixed(2)}\nspam: ${t.spam.toFixed(2)}\nharassment: ${t.harassment.toFixed(2)}` },
        { name: 'Log Channel', value: logCh, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
