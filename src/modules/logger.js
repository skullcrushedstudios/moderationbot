const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor(client) {
        this.client = client;
        this.logChannelId = process.env.LOG_CHANNEL_ID;
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        try {
            await fs.access(this.logDir);
        } catch {
            await fs.mkdir(this.logDir, { recursive: true });
        }
    }

    async log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        console.log(logMessage);
        
        // Write to file
        await this.writeToFile(logMessage);
        
        // Send to Discord log channel if configured
        if (level === 'error' || level === 'warn') {
            await this.sendToDiscordChannel(logMessage, level);
        }
    }

    async writeToFile(message) {
        try {
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const logFile = path.join(this.logDir, `bot-${date}.log`);
            
            await fs.appendFile(logFile, message + '\n');
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    async sendToDiscordChannel(message, level) {
        if (!this.logChannelId) return;
        
        try {
            const logChannel = await this.client.channels.fetch(this.logChannelId);
            if (!logChannel) return;
            
            const color = level === 'error' ? '#DC143C' : '#FFA500';
            const emoji = level === 'error' ? '❌' : '⚠️';
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} Bot ${level.toUpperCase()}`)
                .setDescription(message)
                .setTimestamp();
            
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending to Discord log channel:', error);
        }
    }

    async logViolation(message, analysis, warningCount) {
        const violationData = {
            timestamp: new Date().toISOString(),
            user: {
                id: message.author.id,
                tag: message.author.tag,
                username: message.author.username
            },
            guild: {
                id: message.guild.id,
                name: message.guild.name
            },
            channel: {
                id: message.channel.id,
                name: message.channel.name
            },
            message: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt.toISOString()
            },
            violation: {
                type: analysis.type,
                severity: analysis.severity,
                reason: analysis.reason,
                confidence: analysis.confidence,
                details: analysis.details
            },
            warningCount: warningCount
        };

        // Log to console and file
        await this.log(`VIOLATION: ${message.author.tag} in #${message.channel.name} - ${analysis.reason} (Severity: ${analysis.severity})`, 'warn');
        
        // Write detailed violation to file
        await this.writeViolationToFile(violationData);
        
        // Send to Discord log channel
        await this.sendViolationToDiscord(violationData);
    }

    async writeViolationToFile(violationData) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const violationFile = path.join(this.logDir, `violations-${date}.json`);
            
            // Read existing violations or create empty array
            let violations = [];
            try {
                const existingData = await fs.readFile(violationFile, 'utf8');
                violations = JSON.parse(existingData);
            } catch {
                // File doesn't exist or is empty
            }
            
            // Add new violation
            violations.push(violationData);
            
            // Write back to file
            await fs.writeFile(violationFile, JSON.stringify(violations, null, 2));
        } catch (error) {
            console.error('Error writing violation to file:', error);
        }
    }

    async sendViolationToDiscord(violationData) {
        if (!this.logChannelId) return;
        
        try {
            const logChannel = await this.client.channels.fetch(this.logChannelId);
            if (!logChannel) return;
            
            const violation = violationData.violation;
            const user = violationData.user;
            const channel = violationData.channel;
            
            // Truncate message content if too long
            const messageContent = violationData.message.content.length > 1000 
                ? violationData.message.content.substring(0, 1000) + '...'
                : violationData.message.content;
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('🚨 Moderation Violation Detected')
                .addFields(
                    { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '📍 Channel', value: `#${channel.name}`, inline: true },
                    { name: '⚠️ Warning Count', value: `${violationData.warningCount}`, inline: true },
                    { name: '🔍 Violation Type', value: violation.type, inline: true },
                    { name: '📊 Severity', value: `${(violation.severity * 100).toFixed(1)}%`, inline: true },
                    { name: '🎯 Confidence', value: `${(violation.confidence * 100).toFixed(1)}%`, inline: true },
                    { name: '📝 Reason', value: violation.reason, inline: false },
                    { name: '💬 Message Content', value: `\`\`\`${messageContent}\`\`\``, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `Message ID: ${violationData.message.id}` });
            
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending violation to Discord:', error);
        }
    }

    async logModerationAction(action, user, reason, duration = null) {
        const actionData = {
            timestamp: new Date().toISOString(),
            action: action,
            user: {
                id: user.id,
                tag: user.tag,
                username: user.username
            },
            reason: reason,
            duration: duration
        };

        // Log to console and file
        let logMessage = `MODERATION: ${action.toUpperCase()} applied to ${user.tag} - ${reason}`;
        if (duration) {
            logMessage += ` (Duration: ${duration})`;
        }
        
        await this.log(logMessage, 'info');
        
        // Send to Discord log channel
        await this.sendModerationActionToDiscord(actionData);
    }

    async sendModerationActionToDiscord(actionData) {
        if (!this.logChannelId) return;
        
        try {
            const logChannel = await this.client.channels.fetch(this.logChannelId);
            if (!logChannel) return;
            
            const actionEmojis = {
                'warn': '⚠️',
                'timeout': '⏰',
                'kick': '👢',
                'ban': '🔨'
            };
            
            const actionColors = {
                'warn': '#FFA500',
                'timeout': '#FF6B35',
                'kick': '#FF4500',
                'ban': '#DC143C'
            };
            
            const emoji = actionEmojis[actionData.action] || '🔧';
            const color = actionColors[actionData.action] || '#808080';
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} Moderation Action: ${actionData.action.toUpperCase()}`)
                .addFields(
                    { name: '👤 User', value: `${actionData.user.tag} (${actionData.user.id})`, inline: true },
                    { name: '📝 Reason', value: actionData.reason, inline: false }
                )
                .setTimestamp();
            
            if (actionData.duration) {
                embed.addFields({ name: '⏱️ Duration', value: actionData.duration, inline: true });
            }
            
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending moderation action to Discord:', error);
        }
    }

    async getViolationStats() {
        try {
            const date = new Date().toISOString().split('T')[0];
            const violationFile = path.join(this.logDir, `violations-${date}.json`);
            
            const data = await fs.readFile(violationFile, 'utf8');
            const violations = JSON.parse(data);
            
            const stats = {
                total: violations.length,
                types: {},
                users: {}
            };
            
            violations.forEach(violation => {
                // Count by type
                const type = violation.violation.type;
                stats.types[type] = (stats.types[type] || 0) + 1;
                
                // Count by user
                const userId = violation.user.id;
                stats.users[userId] = (stats.users[userId] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            console.error('Error getting violation stats:', error);
            return { total: 0, types: {}, users: {} };
        }
    }
}

module.exports = Logger;
