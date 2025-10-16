const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

function ensureWhitelist() {
  const file = path.join(process.cwd(), 'config', 'whitelist.json');
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ users: [], roles: [] }, null, 2));
  return file;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage users/roles that bypass moderation (admin only)')
    .addSubcommand(sc => sc
      .setName('adduser')
      .setDescription('Add a user to whitelist')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('removeuser')
      .setDescription('Remove a user from whitelist')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('addrole')
      .setDescription('Add a role to whitelist')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('removerole')
      .setDescription('Remove a role from whitelist')
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('list')
      .setDescription('Show whitelist')),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Only administrators can manage whitelist.', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const file = ensureWhitelist();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.users ||= []; data.roles ||= [];

    if (sub === 'adduser') {
      const u = interaction.options.getUser('user', true);
      if (!data.users.includes(u.id)) data.users.push(u.id);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return interaction.reply({ content: `Whitelisted user ${u.tag}.`, ephemeral: true });
    }
    if (sub === 'removeuser') {
      const u = interaction.options.getUser('user', true);
      data.users = data.users.filter(id => id !== u.id);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return interaction.reply({ content: `Removed ${u.tag} from whitelist.`, ephemeral: true });
    }
    if (sub === 'addrole') {
      const r = interaction.options.getRole('role', true);
      if (!data.roles.includes(r.id)) data.roles.push(r.id);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return interaction.reply({ content: `Whitelisted role ${r.name}.`, ephemeral: true });
    }
    if (sub === 'removerole') {
      const r = interaction.options.getRole('role', true);
      data.roles = data.roles.filter(id => id !== r.id);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return interaction.reply({ content: `Removed role ${r.name} from whitelist.`, ephemeral: true });
    }
    if (sub === 'list') {
      const users = data.users.map(id => `<@${id}>`).join(', ') || 'none';
      const roles = data.roles.map(id => `<@&${id}>`).join(', ') || 'none';
      return interaction.reply({ content: `Users: ${users}\nRoles: ${roles}`, ephemeral: true });
    }
  }
};