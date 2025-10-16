const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmaxwarnings')
    .setDescription('Set the number of warnings before timeout (admin only)')
    .addIntegerOption(o => o.setName('count').setDescription('Warnings before timeout').setRequired(true).setMinValue(1).setMaxValue(50)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can configure this.', ephemeral: true });
    }
    const count = interaction.options.getInteger('count', true);
    process.env.MAX_WARNINGS_BEFORE_TIMEOUT = String(count);
    return interaction.reply({ content: `MAX_WARNINGS_BEFORE_TIMEOUT set to ${count}.`, ephemeral: true });
  }
};
