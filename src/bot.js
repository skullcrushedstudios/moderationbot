const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import modules
const AIModeration = require('./modules/aiModeration');
const ModerationActions = require('./modules/moderationActions');
const Logger = require('./modules/logger');

class DiscordAIModerator {
    constructor() {
        // Create Discord client with necessary intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration
            ]
        });
        
        // Initialize modules
        this.aiModeration = new AIModeration();
        this.moderationActions = new ModerationActions(this.client);
        this.logger = new Logger(this.client);
        
        // Commands container
        this.commands = new Collection();
        this.loadSlashCommands();
        
        // Store user warnings
        this.userWarnings = new Collection();
        
        this.setupEventHandlers();
    }

    loadSlashCommands() {
        try {
            const commandsPath = path.join(__dirname, 'commands');
            if (!fs.existsSync(commandsPath)) return;
            const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
            for (const file of commandFiles) {
                const cmd = require(path.join(commandsPath, file));
                if (cmd && cmd.data && cmd.execute) {
                    this.commands.set(cmd.data.name, cmd);
                }
            }
        } catch (err) {
            console.error('Failed to load slash commands:', err);
        }
    }

    setupEventHandlers() {
        // Bot ready event
        this.client.once(Events.ClientReady, async (client) => {
            console.log(`✅ ${client.user.tag} is online and ready for moderation!`);
            this.logger.log(`Bot started successfully as ${client.user.tag}`);

            // Permission sanity checks per guild
            try {
                for (const [, g] of this.client.guilds.cache) {
                    const me = await g.members.fetchMe();
                    const missing = [];
                    if (!me.permissions.has('ManageMessages')) missing.push('ManageMessages');
                    if (!me.permissions.has('ModerateMembers')) missing.push('ModerateMembers');
                    if (!me.permissions.has('BanMembers')) missing.push('BanMembers');
                    if (missing.length) {
                        await this.logger.log(`Guild ${g.name} (${g.id}) missing permissions: ${missing.join(', ')}`, 'warn');
                    }
                }
            } catch (e) {
                console.error('Permission check failed:', e);
            }

            // Register slash commands (guild if GUILD_ID present for instant availability)
            try {
                const commandsData = Array.from(this.commands.values()).map(c => c.data.toJSON());
                const guildId = process.env.GUILD_ID;
                if (guildId) {
                    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
                    if (guild) {
                        await guild.commands.set(commandsData);
                        console.log(`✅ Registered ${commandsData.length} guild commands`);
                    } else {
                        await this.client.application.commands.set(commandsData);
                        console.log(`✅ Registered ${commandsData.length} global commands`);
                    }
                } else {
                    // If no GUILD_ID, try to register in all guilds the bot is currently in for instant availability
                    const guilds = this.client.guilds.cache;
                    if (guilds.size > 0) {
                        for (const [, g] of guilds) {
                            await g.commands.set(commandsData);
                            console.log(`✅ Registered ${commandsData.length} commands in guild ${g.id}`);
                        }
                    } else {
                        await this.client.application.commands.set(commandsData);
                        console.log(`✅ Registered ${commandsData.length} global commands`);
                    }
                }
            } catch (e) {
                console.error('Failed to register slash commands:', e);
            }
        });

        // Message creation event - main moderation logic
        this.client.on(Events.MessageCreate, async (message) => {
            await this.handleMessage(message);
        });

        // Interaction handler for slash commands
        this.client.on(Events.InteractionCreate, async (interaction) => {
            try {
                if (!interaction.isChatInputCommand()) return;
                const command = this.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction, this);
            } catch (err) {
                console.error('Error handling interaction:', err);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: 'An error occurred while executing this command.', ephemeral: true }).catch(() => {});
                } else {
                    await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true }).catch(() => {});
                }
            }
        });

        // Handle errors
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
            this.logger.log(`Client error: ${error.message}`, 'error');
        });
    }

    async handleMessage(message) {
        // Skip bot messages and system messages
        if (message.author.bot || message.system) return;

        // Ensure we can see content (Message Content Intent)
        if (!message.content || !message.content.trim()) {
            await this.logger.log('Received message with empty content (is Message Content Intent enabled?).', 'warn');
            return;
        }

        // Skip messages from admin roles
        if (this.isAdmin(message.member)) return;

        // Skip if auto-moderation is disabled
        if (process.env.AUTO_MODERATE !== 'true') return;

        try {
            // Analyze message with AI
            const analysis = await this.aiModeration.analyzeMessage(message.content);
            
            if (analysis.violation) {
                await this.handleViolation(message, analysis);
            }

        } catch (error) {
            console.error('Error handling message:', error);
            this.logger.log(`Error processing message: ${error.message}`, 'error');
        }
    }

    async handleViolation(message, analysis) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        // Track warnings
        const warningKey = `${guildId}-${userId}`;
        const currentWarnings = this.userWarnings.get(warningKey) || 0;
        const newWarnings = currentWarnings + 1;
        this.userWarnings.set(warningKey, newWarnings);

        // Log the violation
        await this.logger.logViolation(message, analysis, newWarnings);

        // Take moderation action based on severity and warning count
        const action = this.determineAction(analysis, newWarnings);
        
        switch (action) {
            case 'warn':
                await this.moderationActions.warnUser(message, analysis.reason, newWarnings);
                break;
            case 'timeout':
                await this.moderationActions.timeoutUser(message, analysis.reason);
                break;
            case 'ban':
                await this.moderationActions.banUser(message, analysis.reason);
                break;
        }

        // Delete the violating message
        try {
            await message.delete();
        } catch (error) {
            console.error('Could not delete message:', error);
        }
    }

    determineAction(analysis, warningCount) {
        const maxWarnings = parseInt(process.env.MAX_WARNINGS_BEFORE_TIMEOUT) || 3;
        
        // High severity violations get immediate timeout/ban
        if (analysis.severity >= 0.9) {
            return process.env.BAN_ON_REPEAT_OFFENSE === 'true' ? 'ban' : 'timeout';
        }
        
        // Medium to high severity with multiple warnings
        if (analysis.severity >= 0.7 && warningCount >= maxWarnings) {
            return 'timeout';
        }
        
        // Default action is warning
        return 'warn';
    }

    isAdmin(member) {
        if (!member) return false;
        
        const adminRoleId = process.env.ADMIN_ROLE_ID;
        if (adminRoleId && member.roles.cache.has(adminRoleId)) {
            return true;
        }
        
        // Check whitelist config
        try {
            const fs = require('fs');
            const path = require('path');
            const file = path.join(process.cwd(), 'config', 'whitelist.json');
            if (fs.existsSync(file)) {
                const data = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
                const users = new Set((data.users || []).map(String));
                const roles = new Set((data.roles || []).map(String));
                if (users.has(member.id)) return true;
                for (const [rid] of member.roles.cache) { if (roles.has(String(rid))) return true; }
            }
        } catch {}
        
        // Check for administrator permission
        const { PermissionFlagsBits } = require('discord.js');
        return member.permissions.has(PermissionFlagsBits.Administrator);
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('Shutting down bot...');
        await this.client.destroy();
        process.exit(0);
    }
}

// Create and start the bot
const bot = new DiscordAIModerator();

// Handle process termination
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Start the bot
bot.start();

module.exports = DiscordAIModerator;
