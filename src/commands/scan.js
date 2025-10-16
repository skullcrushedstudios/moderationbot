const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scan')
    .setDescription('Scan the last N messages in this channel using the AI and blocklist')
    .addIntegerOption(o => o.setName('count').setDescription('Number of messages to scan (max 100)').setRequired(true).setMinValue(1).setMaxValue(100)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need Manage Messages to use this.', ephemeral: true });
    }
    const n = interaction.options.getInteger('count', true);
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: n });
    let checked = 0; let violations = 0;
    for (const [, msg] of messages) {
      checked++;
      try {
        await ctx.handleMessage(msg);
        // handleMessage will log and act if needed
      } catch {}
    }
    return interaction.editReply({ content: `Scanned ${checked} messages. Actions were taken where needed.` });
  }
};
