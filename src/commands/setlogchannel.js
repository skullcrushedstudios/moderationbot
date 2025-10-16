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
    .setName('setlogchannel')
    .setDescription('Set the Discord channel ID used for bot logs (admin only)')
    .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can configure the log channel.', ephemeral: true });
    }
    const ch = interaction.options.getChannel('channel', true);
    const ok = upsertEnv('LOG_CHANNEL_ID', ch.id);
    return interaction.reply({ content: ok ? `Log channel set to ${ch}.` : 'Failed to update .env', ephemeral: true });
  }
};
