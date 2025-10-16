const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Toggle automatic moderation on/off (admin only)')
    .addStringOption(opt => opt
      .setName('status')
      .setDescription('on or off')
      .setRequired(true)
      .addChoices(
        { name: 'on', value: 'on' },
        { name: 'off', value: 'off' }
      )
    ),
  async execute(interaction) {
    const { PermissionFlagsBits } = require('discord.js');
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can toggle automod.', ephemeral: true });
    }

    const status = interaction.options.getString('status', true);
    process.env.AUTO_MODERATE = status === 'on' ? 'true' : 'false';
    return interaction.reply({ content: `AUTO_MODERATE set to ${process.env.AUTO_MODERATE}.`, ephemeral: true });
  }
};
