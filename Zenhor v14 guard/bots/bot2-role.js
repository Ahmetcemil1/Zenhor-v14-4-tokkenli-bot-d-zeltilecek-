const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const { bots, voiceChannelId } = require("../config");
const { isWhitelisted, logAction, dropPermissions, hasDangerousPerms } = require("../sharedClient");
const { backupGuild } = require("../utils/backupSystem");
const { joinVoiceChannel } = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

const { token, name, logChannelName } = bots[1]; // Bot2 - Role Koruma

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers
  ],
  partials: [Partials.GuildMember, Partials.User]
});

require("../events/roleEvents")(client); // 🎯 Rol eventlerini yükle

// 🔰 Komutları yükle (alt klasör destekli)
client.commands = new Collection();
function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      loadCommands(fullPath);
    } else if (file.name.endsWith(".js")) {
      const command = require(fullPath);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        console.log(`📥 Komut yüklendi: ${command.data.name}`);
      }
    }
  }
}
loadCommands(path.join(__dirname, "../bot2-commands"));

/* 🔧 Otomatik log kanalı oluşturma */
async function ensureLogChannel(client) {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return console.warn(`[${client.user.username}] Sunucu bulunamadı.`);

    const existingChannel = guild.channels.cache.find(
      c => c.name === client.logChannelName && c.isTextBased()
    );

    if (existingChannel) {
      console.log(`[${client.user.username}] Log kanalı zaten var: #${existingChannel.name}`);
      return;
    }

    const channel = await guild.channels.create({
      name: client.logChannelName,
      type: 0, // GUILD_TEXT
      reason: "Koruma logları için otomatik oluşturuldu"
    });

    console.log(`[${client.user.username}] Yeni log kanalı oluşturuldu: #${channel.name}`);
  } catch (error) {
    console.error(`[${client.user.username}] Log kanalı oluşturulurken hata:`, error);
  }
}

// ✅ Bot hazır olduğunda
client.once("ready", async () => {
  console.log(`[${name}] ${client.user.tag} aktif!`);
  client.logChannelName = logChannelName;

  await ensureLogChannel(client); // 🔧 Log kanalı oluştur

  let channel;
  try {
    channel = await client.channels.fetch(voiceChannelId);
  } catch (err) {
    console.warn(`[${name}] Ses kanalı alınamadı: ${err.message}`);
  }

  if (channel && (channel.type === 2 || channel.type === 13)) {
    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      console.log(`[${name}] Ses kanalına başarıyla bağlanıldı.`);
    } catch (error) {
      console.warn(`[${name}] Ses kanalına bağlanılamadı: ${error.message}`);
    }
  } else {
    console.warn(`[${name}] Ses kanalına bağlanılamadı veya geçersiz kanal tipi.`);
  }
});

// ✅ Slash komut kontrol
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const msg = "❌ Komut çalıştırılırken bir hata oluştu.";
    interaction.deferred || interaction.replied
      ? interaction.editReply({ content: msg })
      : interaction.reply({ content: msg, flags: 64 });
  }
});

client.login(token);