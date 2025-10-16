const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgptmodel')
    .setDescription('Set the GPT model used for nuanced analysis')
    .addStringOption(o => o.setName('model').setDescription('e.g. gpt-4o-mini, gpt-3.5-turbo').setRequired(true)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can change the model.', ephemeral: true });
    }
    process.env.GPT_MODEL = interaction.options.getString('model', true);
    return interaction.reply({ content: `GPT model set to ${process.env.GPT_MODEL}.`, ephemeral: true });
  }
};
