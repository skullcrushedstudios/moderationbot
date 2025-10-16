const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ratelimit')
    .setDescription('Get or set the OpenAI request interval')
    .addSubcommand(sc => sc
      .setName('get')
      .setDescription('Show current min interval in ms')
    )
    .addSubcommand(sc => sc
      .setName('set')
      .setDescription('Set min interval (ms) between OpenAI requests')
      .addIntegerOption(o => o.setName('ms').setDescription('Milliseconds').setRequired(true).setMinValue(0))
    ),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can change rate limit.', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === 'get') {
      return interaction.reply({ content: `Current min interval: ${ctx.aiModeration.getRateLimitMs()} ms.`, ephemeral: true });
    }
    const ms = interaction.options.getInteger('ms', true);
    const ok = ctx.aiModeration.setRateLimitMs(ms);
    return interaction.reply({ content: ok ? `Set min interval to ${ms} ms.` : 'Invalid value.', ephemeral: true });
  }
};
