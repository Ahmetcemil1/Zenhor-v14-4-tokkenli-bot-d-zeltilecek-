const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { bots, voiceChannelId } = require("../config");
const { isWhitelisted, logAction, dropPermissions, checkRoleHierarchy } = require("../sharedClient");
const { joinVoiceChannel } = require("@discordjs/voice");

const { token, name, logChannelName } = bots[0]; // Bot 1: Member Koruma

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.User, Partials.GuildMember]
});

require("../events/memberEvents")(client);

// 📥 Slash komut sistemi
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
loadCommands(path.join(__dirname, "../bot1-commands"));

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

// ✅ Bot hazır olduğunda log kanalını oluştur + ses kanalına bağlan
client.once("ready", async () => {
  console.log(`[${name}] ${client.user.tag} aktif!`);
  client.logChannelName = logChannelName;

  await ensureLogChannel(client); // 🔧 Otomatik log kanalı oluştur

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

// ✅ Slash komut çalıştırma
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