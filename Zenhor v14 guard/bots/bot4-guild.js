const { Client, GatewayIntentBits, Partials, Collection, ChannelType } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const { bots, voiceChannelId } = require("../config");
const { isWhitelisted, logAction, dropPermissions } = require("../sharedClient");
const { backupGuild } = require("../utils/backupSystem");
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require("fs");
const path = require("path");

const { token, name, logChannelName } = bots[3]; // Bot4 - Sunucu Koruma

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.GuildMember]
});

// 🔹 Event yükle
require("../events/guildEvents")(client);

// 🔧 Komutları yükle
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
loadCommands(path.join(__dirname, "../bot4-commands"));

// 🔧 Log kanalı oluşturucu
async function ensureLogChannel(client) {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return console.warn(`[${client.user.username}] Sunucu bulunamadı.`);

    const existing = guild.channels.cache.find(
      c => c.name === client.logChannelName && c.type === ChannelType.GuildText
    );
    if (!existing) {
      const newChannel = await guild.channels.create({
        name: client.logChannelName,
        type: ChannelType.GuildText,
        reason: "Otomatik log kanalı oluşturuldu (guild bot)"
      });
      console.log(`[${client.user.username}] Log kanalı oluşturuldu: #${newChannel.name}`);
    } else {
      console.log(`[${client.user.username}] Log kanalı zaten var: #${existing.name}`);
    }
  } catch (err) {
    console.error(`[${client.user.username}] Log kanalı oluşturulamadı:`, err);
  }
}

// ✅ Bot hazır olduğunda
client.once("ready", async () => {
  console.log(`[${name}] ${client.user.tag} aktif!`);
  client.logChannelName = logChannelName;

  await ensureLogChannel(client); // 🔧 Otomatik log kontrol

  let channel;
  try {
    channel = await client.channels.fetch(voiceChannelId);
  } catch (err) {
    console.warn(`[${name}] Ses kanalı alınamadı: ${err.message}`);
  }
});

// ✅ Slash komutları çalıştırıcı
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