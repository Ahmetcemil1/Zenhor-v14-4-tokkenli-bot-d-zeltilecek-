const fs = require("fs");
const path = require("path");
const { isWhitelisted, logAction, dropPermissions } = require("../sharedClient");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger");
const { backupGuild } = require("../utils/backupSystem");

let backupIntervalStarted = false;

module.exports = client => {

  // ✅ Kanal silinince geri yükle
  client.on("channelDelete", async channel => {
    if (global.restoring) return;

    const logs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

    const backupPath = path.join(__dirname, "..", "backups", "channels.json");
    let backups = [];

    try {
      if (fs.existsSync(backupPath)) {
        const data = fs.readFileSync(backupPath, "utf8");
        backups = JSON.parse(data);
      }
    } catch (err) {
      console.error("❌ [Yedek Okuma Hatası]", err);
    }

    const backup = backups.find(c => c.name === channel.name && c.type === channel.type);
    if (backup) {
      await channel.guild.channels.create({
        name: backup.name,
        type: backup.type,
        parent: backup.parent || null,
        position: backup.position
      }).catch(() => {});
    }

    await logAction(
      client,
      `🗑️ **${entry.executor.tag}**, **#${channel.name}** kanalını sildi. Otomatik geri yüklendi.`,
      entry.executor.id
    );
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "channelDelete", {
      deletedChannel: channel.name,
      restored: !!backup
    });

    await logSecurityEvent(client, "CHANNEL_DELETE", entry.executor, channel, {
      restored: !!backup,
      channelName: channel.name,
      channelType: channel.type
    });

    const guild = channel.guild;
    if (!guild) return console.warn("⚠️ Sunucu bulunamadı!");

    await backupGuild(guild).catch(err => console.error("❌ İlk yedekleme hatası:", err));

    if (!backupIntervalStarted) {
      backupIntervalStarted = true;
      setInterval(() => {
        backupGuild(guild).catch(err => console.error("❌ Zamanlı yedekleme hatası:", err));
      }, 5 * 60 * 1000);
    }
  });

  // ✅ Yeni kanal açıldıysa sil
  client.on("channelCreate", async channel => {
    if (global.restoring) return;

    const logs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

    await channel.delete().catch(() => {});
    await logAction(
      client,
      `📛 **${entry.executor.tag}**, izinsiz **#${channel.name}** kanalını oluşturdu. Kanal silindi.`,
      entry.executor.id
    );
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "channelCreate", {
      createdChannel: channel.name
    });

    await logSecurityEvent(client, "CHANNEL_CREATE", entry.executor, channel, {
      createdChannel: channel.name,
      type: channel.type
    });
  });

};
