const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

// Load Config
let config = require('./config.json');

function saveConfig() {
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 1. Bot Ready & Status Setup (Idle + Custom Status)
client.on('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);

    // Set Bot to IDLE and Custom Status: Discord.gg/MEGA
    client.user.setPresence({
        activities: [{ name: 'customstatus', state: 'Discord.gg/MEGA', type: ActivityType.Custom }],
        status: 'idle', 
    });

    // Deploy Slash Commands
    const commands = [
        new SlashCommandBuilder()
            .setName('id_team')
            .setDescription('Set the staff role that can access tickets')
            .addRoleOption(option => option.setName('role').setDescription('Staff role').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('logo')
            .setDescription('Change the main ticket panel top logo')
            .addStringOption(option => option.setName('url').setDescription('Image URL').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('banner')
            .setDescription('Change the ticket panel / welcome banner')
            .addStringOption(option => option.setName('url').setDescription('Image URL').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('setup_ticket')
            .setDescription('Send the main ticket creation panel')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        new SlashCommandBuilder()
            .setName('set_welcome')
            .setDescription('Set the welcome message channel')
            .addChannelOption(option => option.setName('channel').setDescription('Welcome channel').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
        new SlashCommandBuilder()
            .setName('setup_logs')
            .setDescription('Set the logs channel for new members')
            .addChannelOption(option => option.setName('channel').setDescription('Logs channel').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Successfully synced slash commands.');
    } catch (error) {
        console.error(error);
    }
});

// 2. Slash Commands Interaction Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'id_team') {
        const role = interaction.options.getRole('role');
        config.team_role_id = role.id;
        saveConfig();
        await interaction.reply({ content: `✅ Staff role has been set to: ${role.name}`, ephemeral: true });
    }

    if (interaction.commandName === 'logo') {
        config.logo_url = interaction.options.getString('url');
        saveConfig();
        await interaction.reply({ content: `✅ Panel logo updated successfully!`, ephemeral: true });
    }

    if (interaction.commandName === 'banner') {
        config.bannerUrl = interaction.options.getString('url');
        saveConfig();
        await interaction.reply({ content: `✅ Panel & Welcome banner updated successfully!`, ephemeral: true });
    }

    if (interaction.commandName === 'set_welcome') {
        const channel = interaction.options.getChannel('channel');
        config.welcome_channel_id = channel.id;
        saveConfig();
        await interaction.reply({ content: `✅ Welcome channel set to: ${channel}`, ephemeral: true });
    }

    if (interaction.commandName === 'setup_logs') {
        const channel = interaction.options.getChannel('channel');
        config.logs_channel_id = channel.id;
        saveConfig();
        await interaction.reply({ content: `✅ Logs channel set to: ${channel}`, ephemeral: true });
    }

    if (interaction.commandName === 'setup_ticket') {
        const embed = new EmbedBuilder()
            .setTitle("🎫 MTD Ticket Center")
            .setDescription("🇮🇹 Apri un ticket e ricevi supporto dal nostro staff.\n🇬🇧 Open a ticket and get assistance from our team.")
            .setColor(0xdd2e44)
            .setThumbnail(config.logo_url)
            .setImage(config.banner_url);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_support').setLabel('Support').setStyle(ButtonStyle.Danger).setEmoji('🛠️'),
            new ButtonBuilder().setCustomId('ticket_unban').setLabel('Buy Unban').setStyle(ButtonStyle.Danger).setEmoji('🔓'),
            new ButtonBuilder().setCustomId('ticket_cheater').setLabel('Report Cheater').setStyle(ButtonStyle.Danger).setEmoji('💻'),
            new ButtonBuilder().setCustomId('ticket_ceo').setLabel('CEO Contact').setStyle(ButtonStyle.Danger).setEmoji('👑')
        );

        await interaction.reply({ content: '✅ Ticket Panel sent!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [buttons] });
    }
});

// 3. Ticket Buttons System
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('ticket_')) {
        const section = interaction.customId.replace('ticket_', '').toUpperCase();
        const guild = interaction.guild;
        const user = interaction.user;

        if (!config.team_role_id) {
            return interaction.reply({ content: "❌ Staff role is not configured. Admin must use `/id_team` first.", ephemeral: true });
        }

        const staffRole = guild.roles.cache.get(config.team_role_id);
        if (!staffRole) return interaction.reply({ content: "❌ Configured staff role not found in server.", ephemeral: true });

        // Channel creation: ticket-[user_id]
        const channelName = `ticket-${user.id}`;
        
        await interaction.deferReply({ ephemeral: true });

        const ticketChannel = await guild.channels.create({
            name: channelName,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
            ]
        });

        config.ticket_counter++;
        saveConfig();

        await interaction.editReply({ content: `✅ Your ticket has been created: ${ticketChannel}` });

        // Inner Ticket Message
        await ticketChannel.send({ content: `${user} | ${staffRole}` });

        const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const innerEmbed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setDescription(
                `**[👤]: Ticket Owner**\n${user}\n\n` +
                `**[🛡️]: Ticket Admins**\n${staffRole}\n\n` +
                `**[📅]: Ticket Date**\n${formattedDate}\n\n` +
                `**[🔢]: Ticket Number**       **[❓]: Ticket Section**\n` +
                `\`${config.ticket_counter}\`                                 \`${section}\``
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        const actionButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('action_options').setLabel('Ticket Options').setStyle(ButtonStyle.Secondary).setEmoji('📁'),
            new ButtonBuilder().setCustomId('action_claim').setLabel('Claim').setStyle(ButtonStyle.Secondary).setEmoji('💼')
        );

        await ticketChannel.send({ embeds: [innerEmbed], components: [actionButtons] });
    }

    // Handle Inner Ticket Actions (Claim / Options)
    if (interaction.customId === 'action_claim') {
        await interaction.reply({ content: `💼 This ticket has been claimed by ${interaction.user}` });
    }
    if (interaction.customId === 'action_options') {
        await interaction.reply({ content: `📁 Options menu triggered (Close features can be handled here).`, ephemeral: true });
    }
});

// 4. Welcome Event & Logs System
client.on('guildMemberAdd', async member => {
    const formattedDate = member.user.createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // --- Welcome Channel ---
    if (config.welcome_channel_id) {
        const welcomeChannel = member.guild.channels.cache.get(config.welcome_channel_id);
        if (welcomeChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`╰ Welcome to ${member.guild.name}!`)
                .setDescription(`│ ╰ Hello ${member}, we're glad to have you here!\n\n` +
                                `╰ **__Member Information__**\n` +
                                `**User:** ${member.user.username}\n` +
                                `**ID:** \`${member.id}\`\n` +
                                `**Member Count:** \`#${member.guild.memberCount}\` Members\n\n` +
                                `╰ **__Account Created__**\n` +
                                `${formattedDate}`)
                .setColor(0x2b2d31)
                // User Avatar displayed on the right side
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setImage(config.banner_url);

            await welcomeChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
        }
    }

    // --- Logs Channel ---
    if (config.logs_channel_id) {
        const logsChannel = member.guild.channels.cache.get(config.logs_channel_id);
        if (logsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('📥 Member Joined')
                .setDescription(`🟢 **${member.user.username}** has joined the server.`)
                .addFields(
                    { name: '👤 User Mention', value: `${member}`, inline: true },
                    { name: '🆔 User ID', value: `\`${member.id}\``, inline: true },
                    { name: '📅 Account Created', value: `${formattedDate}`, inline: false }
                )
                .setColor(0x57f287)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await logsChannel.send({ embeds: [logEmbed] });
        }
    }
});

client.login(config.token);