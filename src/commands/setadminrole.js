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
    .setName('setadminrole')
    .setDescription('Set a role that bypasses moderation (admin only)')
    .addRoleOption(o => o.setName('role').setDescription('Role to bypass moderation').setRequired(true)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can configure the admin role.', ephemeral: true });
    }
    const role = interaction.options.getRole('role', true);
    const ok = upsertEnv('ADMIN_ROLE_ID', role.id);
    return interaction.reply({ content: ok ? `Admin role set to ${role}.` : 'Failed to update .env', ephemeral: true });
  }
};
