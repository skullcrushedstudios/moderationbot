const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exportviolations')
    .setDescription('Export the violations JSON for a given date (YYYY-MM-DD)')
    .addStringOption(o => o.setName('date').setDescription('YYYY-MM-DD (defaults to today)').setRequired(false)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to use this.', ephemeral: true });
    }
    const fs = require('fs');
    const path = require('path');
    const date = interaction.options.getString('date') || new Date().toISOString().split('T')[0];
    const file = path.join(process.cwd(), 'logs', `violations-${date}.json`);
    if (!fs.existsSync(file)) {
      return interaction.reply({ content: `No violations file for ${date}.`, ephemeral: true });
    }
    return interaction.reply({ files: [file], ephemeral: true });
  }
};
