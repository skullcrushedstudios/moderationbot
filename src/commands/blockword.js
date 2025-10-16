const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function parseWords(input) {
  if (!input) return [];
  const items = input
    .split(/\r?\n|,|;/)
    .map(s => s.trim())
    .filter(Boolean);
  return items;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blockword')
    .setDescription('Manage blocked words for auto-moderation (admin only)')
    .addSubcommand(sc => sc
      .setName('add')
      .setDescription('Add a single word or phrase to the blocklist')
      .addStringOption(o => o.setName('word').setDescription('Word or phrase').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('addmany')
      .setDescription('Add multiple words separated by newline, comma, or semicolon')
      .addStringOption(o => o.setName('words').setDescription('Multiple words').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('remove')
      .setDescription('Remove a word from the blocklist')
      .addStringOption(o => o.setName('word').setDescription('Word to remove').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('list')
      .setDescription('Show current blocked words (first 150)')),

  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can manage the blocklist.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const word = interaction.options.getString('word', true);
      ctx.aiModeration.addBlockedWords(word);
      return interaction.reply({ content: `Added to blocklist: "${word}"`, ephemeral: true });
    }

    if (sub === 'addmany') {
      const raw = interaction.options.getString('words', true);
      const items = parseWords(raw);
      if (!items.length) return interaction.reply({ content: 'No words provided.', ephemeral: true });
      ctx.aiModeration.addBlockedWords(items);
      return interaction.reply({ content: `Added ${items.length} words to blocklist.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const word = interaction.options.getString('word', true);
      ctx.aiModeration.removeBlockedWord(word);
      return interaction.reply({ content: `Removed from blocklist: "${word}"`, ephemeral: true });
    }

    if (sub === 'list') {
      const words = ctx.aiModeration.getBlockedWords();
      const preview = words.slice(0, 150).join(', ');
      const more = words.length > 150 ? `\n...and ${words.length - 150} more` : '';
      return interaction.reply({ content: preview + more || 'Blocklist is empty.', ephemeral: true });
    }
  }
};
