const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

function upsertEnv(key, value) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) content = content.replace(regex, `${key}=${value}`);
    else content += (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
    fs.writeFileSync(envPath, content);
    process.env[key] = String(value);
    return true;
  } catch { return false; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setguildid')
    .setDescription('Set GUILD_ID for rapid command registration (admin only)')
    .addStringOption(o => o.setName('id').setDescription('Guild ID').setRequired(true)),
  async execute(interaction, ctx) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can configure this.', ephemeral: true });
    }
    const id = interaction.options.getString('id', true);
    const ok = upsertEnv('GUILD_ID', id);
    return interaction.reply({ content: ok ? `GUILD_ID set to ${id}. Use /registercommands to refresh.` : 'Failed to update .env', ephemeral: true });
  }
};
