const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getgptmodel')
    .setDescription('Show the current GPT model used for analysis'),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) &&
        !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You need moderation permissions to view this.', ephemeral: true });
    }
    const model = process.env.GPT_MODEL || 'gpt-3.5-turbo';
    return interaction.reply({ content: `Current GPT model: ${model}`, ephemeral: true });
  }
};
