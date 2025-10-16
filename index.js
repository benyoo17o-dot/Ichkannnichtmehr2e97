const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const CONFIG = {
  DISCORD_TOKEN: process.env.
MTQyODEyNzk4MTgyOTc1MDgwNQ.GXxVp_.7DzvJJfxpRjWYFwXWjrUOsyO_fZzRjPJrEPz98,
  PORT: process.env.PORT || 5000,
};

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

let botConfig = {
  status: 'online',
  statusMessage: '🎮 Rekii Bot Active',
};

client.once('ready', () => {
  console.log(`✅ Rekii Bot online als ${client.user.tag}`);
  registerCommands();
});

function registerCommands() {
  const commands = [
    { name: 'ping', description: 'Bot Ping' },
    { 
      name: 'embed',
      description: 'Custom Embed',
      options: [
        { name: 'titel', type: 3, description: 'Titel', required: true },
        { name: 'beschreibung', type: 3, description: 'Beschreibung', required: true },
      ],
    },
    { 
      name: 'kick',
      description: 'Nutzer kicken',
      options: [
        { name: 'nutzer', type: 6, description: 'Nutzer', required: true },
        { name: 'grund', type: 3, description: 'Grund', required: false },
      ],
    },
    { 
      name: 'ban',
      description: 'Nutzer bannen',
      options: [
        { name: 'nutzer', type: 6, description: 'Nutzer', required: true },
        { name: 'grund', type: 3, description: 'Grund', required: false },
      ],
    },
    { 
      name: 'mute',
      description: 'Nutzer muten',
      options: [
        { name: 'nutzer', type: 6, description: 'Nutzer', required: true },
        { name: 'dauer', type: 4, description: 'Minuten', required: false },
      ],
    },
    { name: 'lock', description: 'Channel sperren' },
    { name: 'unlock', description: 'Channel entsperren' },
    { 
      name: 'clear',
      description: 'Nachrichten loeschen',
      options: [
        { name: 'anzahl', type: 4, description: 'Anzahl', required: true },
      ],
    },
  ];

  const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);

  (async () => {
    try {
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      console.log('✅ Commands registriert');
    } catch (error) {
      console.error('Fehler:', error);
    }
  })();
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  try {
    if (commandName === 'ping') {
      await interaction.reply(`Pong! ${client.ws.ping}ms`);
    }

    if (commandName === 'embed') {
      const titel = options.getString('titel');
      const beschreibung = options.getString('beschreibung');
      const embed = new EmbedBuilder()
        .setTitle(titel)
        .setDescription(beschreibung)
        .setColor('#808080')
        .setFooter({ text: 'Rekii Bot' })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'kick') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: 'Keine Berechtigung!', ephemeral: true });
      }
      const user = options.getUser('nutzer');
      const grund = options.getString('grund') || 'Kein Grund';
      try {
        await interaction.guild.members.kick(user, grund);
        await interaction.reply(`${user.tag} gekickt`);
      } catch (error) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }

    if (commandName === 'ban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: 'Keine Berechtigung!', ephemeral: true });
      }
      const user = options.getUser('nutzer');
      const grund = options.getString('grund') || 'Kein Grund';
      try {
        await interaction.guild.bans.create(user, { reason: grund });
        await interaction.reply(`${user.tag} gebannt`);
      } catch (error) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }

    if (commandName === 'mute') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: 'Keine Berechtigung!', ephemeral: true });
      }
      const user = options.getUser('nutzer');
      const dauer = (options.getInteger('dauer') || 10) * 60 * 1000;
      try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(dauer);
        await interaction.reply(`${user.tag} gemutet`);
      } catch (error) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }

    if (commandName === 'lock') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'Keine Berechtigung!', ephemeral: true });
      }
      try {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply('Channel gesperrt');
      } catch (error) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }

    if (commandName === 'unlock') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'Keine Berechtigung!', ephemeral: true });
      }
      try {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply('Channel entsperrt');
      } catch (error) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }

    if (commandName === 'clear') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: 'Keine Berechtigung!', ephemeral: true });
      }
      const anzahl = options.getInteger('anzahl');
      if (anzahl > 100) return interaction.reply({ content: 'Max 100!', ephemeral: true });
      try {
        await interaction.channel.bulkDelete(anzahl);
        await interaction.reply({ content: `${anzahl} geloescht`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: 'Fehler!', ephemeral: true });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

app.get('/api/status', (req, res) => {
  res.json({ bot: 'online', guilds: client.guilds.cache.size });
});

client.login(CONFIG.DISCORD_TOKEN);

app.listen(CONFIG.PORT, () => {
  console.log(`API laeuft auf Port ${CONFIG.PORT}`);
});
