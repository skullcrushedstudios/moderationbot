const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

class ModerationActions {
    constructor(client) {
        this.client = client;
        this.timeoutDuration = parseInt(process.env.TIMEOUT_DURATION_MINUTES) * 60 * 1000 || 600000; // 10 minutes default
    }

    setTimeoutMinutes(minutes) {
        const m = parseInt(minutes);
        if (!Number.isFinite(m) || m <= 0) return false;
        this.timeoutDuration = m * 60 * 1000;
        process.env.TIMEOUT_DURATION_MINUTES = String(m);
        return true;
    }

    async warnMember(guild, member, reason, warningCount = 0, channel = null) {
        try {
            const { EmbedBuilder } = require('discord.js');
            const user = member.user;
            const warningEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Warning')
                .setDescription(`You have received a warning in ${guild.name}`)
                .addFields(
                    { name: 'Reason', value: reason || 'Manual moderation action', inline: false },
                    { name: 'Warning Count', value: `${warningCount}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Please review the server rules to avoid further action.' });

            try {
                await user.send({ embeds: [warningEmbed] });
            } catch {
                if (channel) {
                    const msg = await channel.send({ content: `${user}`, embeds: [warningEmbed] });
                    setTimeout(() => msg.delete().catch(() => {}), 30000);
                }
            }
            return true;
        } catch (e) { console.error('warnMember error:', e); return false; }
    }

    async timeoutMember(guild, member, reason, minutes = null) {
        try {
            const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
            if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) return false;
            if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ModerateMembers)) return false;

            const duration = (minutes ? minutes * 60 * 1000 : this.timeoutDuration);
            await member.timeout(duration, `Manual moderation: ${reason || 'Timeout'}`);

            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('⏰ Timeout Applied')
                .addFields(
                    { name: 'Reason', value: reason || 'Manual moderation', inline: false },
                    { name: 'Duration', value: `${Math.floor(duration / 60000)} minutes`, inline: true }
                )
                .setTimestamp();
            try { await member.user.send({ embeds: [embed] }); } catch {}
            return true;
        } catch (e) { console.error('timeoutMember error:', e); return false; }
    }

    async banMember(guild, member, reason) {
        try {
            const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
            if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) return false;
            if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ModerateMembers)) return false;
            const embed = new EmbedBuilder()
                .setColor('#DC143C')
                .setTitle('🔨 Banned')
                .addFields({ name: 'Reason', value: reason || 'Manual moderation', inline: false })
                .setTimestamp();
            try { await member.user.send({ embeds: [embed] }); } catch {}
            await member.ban({ deleteMessageDays: 7, reason: `Manual moderation: ${reason || ''}` });
            return true;
        } catch (e) { console.error('banMember error:', e); return false; }
    }

    async kickMember(guild, member, reason) {
        try {
            const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
            if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) return false;
            if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ModerateMembers)) return false;
            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle('👢 Kicked')
                .addFields({ name: 'Reason', value: reason || 'Manual moderation', inline: false })
                .setTimestamp();
            try { await member.user.send({ embeds: [embed] }); } catch {}
            await member.kick(`Manual moderation: ${reason || ''}`);
            return true;
        } catch (e) { console.error('kickMember error:', e); return false; }
    }

    async warnUser(message, reason, warningCount) {
        try {
            const user = message.author;
            const guild = message.guild;

            // Create warning embed
            const warningEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Warning')
                .setDescription(`You have received a warning in ${guild.name}`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Warning Count', value: `${warningCount}`, inline: true },
                    { name: 'Message Channel', value: `${message.channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Please review the server rules to avoid further action.` });

            // Send DM to user
            try {
                await user.send({ embeds: [warningEmbed] });
                console.log(`✅ Warning sent to ${user.tag}`);
            } catch (error) {
                console.log(`❌ Could not DM ${user.tag}: ${error.message}`);
                
                // If can't DM, post in channel temporarily
                const channelWarning = await message.channel.send({
                    content: `${user}, you have been warned.`,
                    embeds: [warningEmbed]
                });
                
                // Delete the warning message after 30 seconds
                setTimeout(() => {
                    channelWarning.delete().catch(console.error);
                }, 30000);
            }

            return true;

        } catch (error) {
            console.error('Error warning user:', error);
            return false;
        }
    }

    async timeoutUser(message, reason) {
        try {
            const member = message.member;
            const guild = message.guild;

            // Check if bot has permission to timeout users
            if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                console.error('Bot lacks permission to timeout members');
                return false;
            }

            // Check if user can be timed out (not admin/mod)
            if (member.permissions.has(PermissionFlagsBits.Administrator) || 
                member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                console.log(`Cannot timeout ${member.user.tag} - has moderation permissions`);
                return false;
            }

            // Apply timeout
            await member.timeout(this.timeoutDuration, `AI Moderation: ${reason}`);

            // Create timeout embed
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('⏰ Timeout Applied')
                .setDescription(`You have been timed out in ${guild.name}`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Duration', value: `${Math.floor(this.timeoutDuration / 60000)} minutes`, inline: true },
                    { name: 'Message Channel', value: `${message.channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'You will be able to participate again once the timeout expires.' });

            // Send DM to user
            try {
                await member.user.send({ embeds: [timeoutEmbed] });
            } catch (error) {
                console.log(`Could not DM ${member.user.tag} about timeout`);
            }

            console.log(`✅ ${member.user.tag} has been timed out for ${Math.floor(this.timeoutDuration / 60000)} minutes`);
            return true;

        } catch (error) {
            console.error('Error timing out user:', error);
            return false;
        }
    }

    async banUser(message, reason) {
        try {
            const member = message.member;
            const guild = message.guild;

            // Check if bot has permission to ban users
            if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
                console.error('Bot lacks permission to ban members');
                return false;
            }

            // Check if user can be banned (not admin/mod)
            if (member.permissions.has(PermissionFlagsBits.Administrator) || 
                member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                console.log(`Cannot ban ${member.user.tag} - has moderation permissions`);
                return false;
            }

            // Create ban embed
            const banEmbed = new EmbedBuilder()
                .setColor('#DC143C')
                .setTitle('🔨 Banned')
                .setDescription(`You have been banned from ${guild.name}`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Message Channel', value: `${message.channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'If you believe this was an error, please contact server administrators.' });

            // Send DM to user before banning
            try {
                await member.user.send({ embeds: [banEmbed] });
            } catch (error) {
                console.log(`Could not DM ${member.user.tag} about ban`);
            }

            // Apply ban (delete messages from last 7 days)
            await member.ban({
                deleteMessageDays: 7,
                reason: `AI Moderation: ${reason}`
            });

            console.log(`✅ ${member.user.tag} has been banned`);
            return true;

        } catch (error) {
            console.error('Error banning user:', error);
            return false;
        }
    }

    async kickUser(message, reason) {
        try {
            const member = message.member;
            const guild = message.guild;

            // Check if bot has permission to kick users
            if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
                console.error('Bot lacks permission to kick members');
                return false;
            }

            // Check if user can be kicked (not admin/mod)
            if (member.permissions.has(PermissionFlagsBits.Administrator) || 
                member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                console.log(`Cannot kick ${member.user.tag} - has moderation permissions`);
                return false;
            }

            // Create kick embed
            const kickEmbed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle('👢 Kicked')
                .setDescription(`You have been kicked from ${guild.name}`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Message Channel', value: `${message.channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'You can rejoin the server if you have an invite link.' });

            // Send DM to user before kicking
            try {
                await member.user.send({ embeds: [kickEmbed] });
            } catch (error) {
                console.log(`Could not DM ${member.user.tag} about kick`);
            }

            // Apply kick
            await member.kick(`AI Moderation: ${reason}`);

            console.log(`✅ ${member.user.tag} has been kicked`);
            return true;

        } catch (error) {
            console.error('Error kicking user:', error);
            return false;
        }
    }

    async deleteMessage(message, reason = 'Violates community guidelines') {
        try {
            await message.delete();
            console.log(`✅ Deleted message from ${message.author.tag}: ${reason}`);
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }
}

module.exports = ModerationActions;
