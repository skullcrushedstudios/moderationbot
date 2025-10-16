const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete the last N messages in this channel')
    .addIntegerOption(o => o.setName('count').setDescription('Number of messages (max 100)').setRequired(true).setMinValue(1).setMaxValue(100)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need Manage Messages to use this.', ephemeral: true });
    }
    const n = interaction.options.getInteger('count', true);
    await interaction.deferReply({ ephemeral: true });
    const deleted = await interaction.channel.bulkDelete(n, true).catch(() => null);
    return interaction.editReply({ content: deleted ? `Deleted ${deleted.size} message(s).` : 'Failed to delete messages (messages older than 14 days cannot be deleted).'});
  }
};
