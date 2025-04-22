const fs = require("fs");
const path = require("path");
const config = require("./config");
const { Collection, Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { addLog } = require("./utils/logHistory");
const { setBotStatus } = require("./statusManager");

const testPath = path.join(__dirname, "config", "testmode.json");
const whitelistPath = path.join(__dirname, "data", "whitelist.json");

const intelligentBlockedActions = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers
];

// ✅ WHITELIST
function isWhitelisted(id) {
  if (!fs.existsSync(whitelistPath)) return false;
  return JSON.parse(fs.readFileSync(whitelistPath, "utf8")).includes(id);
}
function addToWhitelist(id) {
  const list = fs.existsSync(whitelistPath) ? JSON.parse(fs.readFileSync(whitelistPath, "utf8")) : [];
  if (!list.includes(id)) {
    list.push(id);
    fs.writeFileSync(whitelistPath, JSON.stringify(list, null, 2));
  }
}
function removeFromWhitelist(id) {
  if (!fs.existsSync(whitelistPath)) return;
  const updated = JSON.parse(fs.readFileSync(whitelistPath, "utf8")).filter(i => i !== id);
  fs.writeFileSync(whitelistPath, JSON.stringify(updated, null, 2));
}
function getWhitelist() {
  if (!fs.existsSync(whitelistPath)) return [];
  return JSON.parse(fs.readFileSync(whitelistPath, "utf8"));
}
function clearWhitelist() {
  fs.writeFileSync(whitelistPath, JSON.stringify([]));
}

// 🔒 YETKİ DÜŞÜRME
async function dropPermissions(member) {
  try {
    const roles = [...member.roles.cache.keys()].filter(r => r !== member.guild.id);
    await member.roles.remove(roles);
    await logAction(member.client, `⚠️ ${member.user.tag} adlı kişinin tüm rolleri kaldırıldı.`, member.id);
  } catch (e) {
    console.error("dropPermissions:", e);
  }
}

// 📢 LOG AKTARIM
async function logAction(client, message, userId) {
  try {
    const guild = client.guilds.cache.first();
    const logChannelName = client.logChannelName || "guard-log";
    const logChannel = guild.channels.cache.find(c => c.name === logChannelName && c.isTextBased());
    const user = await client.users.fetch(userId).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Güvenlik Logu")
      .setDescription(`> ${message}`)
      .setColor("Red")
      .setTimestamp()
      .setFooter({ text: client.user.username });

    if (config.systems.logToChannel && logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
    if (config.systems.logToUserDM && user) {
      const userEmbed = EmbedBuilder.from(embed).setTitle("📢 Bildirim");
      user.send({ embeds: [userEmbed] }).catch(() => {});
    }

    addLog(message);
    saveSecurityLog(client.user.username, message);
  } catch (e) {
    console.error("logAction:", e);
  }
}

// 🔐 ROL HİYERARŞİSİ
function hasDangerousPerms(role) {
  return intelligentBlockedActions.some(p => role.permissions.has(p));
}
async function checkRoleHierarchy(oldM, newM, client) {
  const added = newM.roles.cache.filter(role => !oldM.roles.cache.has(role.id));
  for (const role of added.values()) {
    if (hasDangerousPerms(role)) {
      await newM.roles.remove(role).catch(() => {});
      await logAction(client, `🚫 ${oldM.user.tag} kullanıcısı ${newM.user.tag}'a tehlikeli bir rol vermeye çalıştı.`, oldM.id);
    }
  }
}

// 🧪 TEST MODU
function isTestMode() {
  if (!fs.existsSync(testPath)) return false;
  return JSON.parse(fs.readFileSync(testPath, "utf8")).enabled;
}
function setTestMode(state) {
  fs.writeFileSync(testPath, JSON.stringify({ enabled: state }, null, 2));
}

// 📁 DİNAMİK YÜKLEYİCİLER
function getAllFiles(dir, ext = ".js", arr = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) getAllFiles(fullPath, ext, arr);
    else if (file.name.endsWith(ext)) arr.push(fullPath);
  }
  return arr;
}
async function loadCommands(client, dir) {
  client.commands = new Collection();
  for (const file of getAllFiles(dir)) {
    const command = require(file);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`✅ ${client.user?.username || "Bot"} komutu: ${command.data.name}`);
    }
  }
}
async function loadEvents(client, dir) {
  for (const file of getAllFiles(dir)) {
    const event = require(file);
    const name = path.basename(file, ".js");
    client.on(name, (...args) => event(client, ...args));
    console.log(`📣 ${client.user?.username || "Bot"} eventi: ${name}`);
  }
}

// 📂 GÜVENLİK LOGUNU KAYDET
function saveSecurityLog(botName, message) {
  try {
    const date = new Date().toISOString().split("T")[0];
    const logDir = path.join(__dirname, "logs", "security");
    const logFile = path.join(logDir, `${date}.json`);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    let logs = [];
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
    }

    logs.unshift({ bot: botName, time: new Date().toISOString(), message });
    fs.writeFileSync(logFile, JSON.stringify(logs.slice(0, 50), null, 2), "utf8");
  } catch (err) {
    console.error("❌ Güvenlik logu kaydedilemedi:", err);
  }
}

// 🤖 BOT BAŞLAT
function createClient(botConfig, commandsFolder) {
  const client = new Client({
    intents: config.botIntents.map(intent => GatewayIntentBits[intent]),
    partials: [Partials.GuildMember, Partials.User],
  });

  // ✅ logChannelName hemen tanımlanmalı
  client.logChannelName = botConfig.logChannelName;

  client.once("ready", async () => {
    console.log(`🤖 ${client.user.tag} aktif.`);

    setBotStatus(client);

    const channel = await client.channels.fetch(config.voiceChannelId).catch(() => null);
    if (channel && (channel.type === 2 || channel.type === 13)) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
    }

    await loadCommands(client, path.join(__dirname, commandsFolder));

    const duty = botConfig.duty;
    const eventFile = {
      member: "memberEvents.js",
      role: "roleEvents.js",
      channel: "channelEvents.js",
      guild: "guildEvents.js"
    }[duty];

    if (eventFile) {
      const eventPath = path.join(__dirname, "events", eventFile);
      if (fs.existsSync(eventPath)) {
        require(eventPath)(client);
        console.log(`✅ ${client.user.tag} için ${eventFile} yüklendi.`);
      } else {
        console.warn(`⚠️ Event dosyası bulunamadı: ${eventFile}`);
      }
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error("[AUTO] Autocomplete hatası:", error);
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error("[COMMAND] Komut çalıştırma hatası:", error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "❌ Komut çalıştırılırken bir hata oluştu.", ephemeral: true });
        } else {
          await interaction.reply({ content: "❌ Komut çalıştırılırken bir hata oluştu.", ephemeral: true });
        }
      }
    }
  });

  // ✅ Giriş burada yapılmalı
  client.login(botConfig.token).catch(err => {
    console.error(`❌ ${botConfig.name} giriş yapılamadı:`, err.message);
  });
}

module.exports = {
  createClient,
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelist,
  clearWhitelist,
  dropPermissions,
  logAction,
  hasDangerousPerms,
  checkRoleHierarchy,
  isTestMode,
  setTestMode,
  loadCommands,
  loadEvents,
  saveSecurityLog
};
