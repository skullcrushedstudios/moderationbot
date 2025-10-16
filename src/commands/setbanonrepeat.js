const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbanonrepeat')
    .setDescription('Toggle ban on repeat severe offenses (admin only)')
    .addBooleanOption(o => o.setName('enabled').setDescription('true to enable').setRequired(true)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can configure this.', ephemeral: true });
    }
    const enabled = interaction.options.getBoolean('enabled', true);
    process.env.BAN_ON_REPEAT_OFFENSE = enabled ? 'true' : 'false';
    return interaction.reply({ content: `BAN_ON_REPEAT_OFFENSE set to ${process.env.BAN_ON_REPEAT_OFFENSE}.`, ephemeral: true });
  }
};
