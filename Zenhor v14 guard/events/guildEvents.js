const fs = require("fs");
const path = require("path");
const { isWhitelisted, logAction, dropPermissions } = require("../sharedClient");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger");
const { backupGuild } = require("../utils/backupSystem");

let backupIntervalStarted = false;

module.exports = client => {

  const events = [

    {
      name: "emojiCreate",
      async execute(emoji) {
        const logs = await emoji.guild.fetchAuditLogs({ type: 60, limit: 1 }).catch(() => {});
        const entry = logs?.entries.first();
        if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

        await emoji.delete().catch(() => {});
        await logAction(client, `🆕 **${entry.executor.tag}**, izinsiz olarak **"${emoji.name}"** adlı emojiyi oluşturdu. Emoji silindi.`, entry.executor.id);
        await dropPermissions(entry.executor);

        saveDetailedLog(entry.executor.tag, "Emoji Oluşturma", { emoji: emoji.name });
        await logSecurityEvent(client, "EMOJI_CREATE", entry.executor, emoji, { emoji: emoji.name });

        startBackupLoop(emoji.guild, client);
      }
    },

    {
      name: "emojiDelete",
      async execute(emoji) {
        const logs = await emoji.guild.fetchAuditLogs({ type: 62, limit: 1 }).catch(() => {});
        const entry = logs?.entries.first();
        if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

        const backupPath = path.join(__dirname, "..", "backups", "emojis.json");
        let backupEmojis = [];

        try {
          if (fs.existsSync(backupPath)) {
            const data = fs.readFileSync(backupPath, "utf8");
            backupEmojis = JSON.parse(data);
          }
        } catch (err) {
          console.error("[Yedek Okuma Hatası - Emojiler]", err);
        }

        const emojiData = backupEmojis.find(e => e.name === emoji.name);
        if (!emojiData) return;

        await emoji.guild.emojis.create({ name: emojiData.name, attachment: emojiData.url }).catch(() => {});
        await logAction(client, `🌀 **${entry.executor.tag}**, \`${emoji.name}\` emojisini sildi. Emoji yedekten geri yüklendi.`, entry.executor.id);
        await dropPermissions(entry.executor);

        saveDetailedLog(entry.executor.tag, "Emoji Silme", { emoji: emoji.name, restored: !!emojiData });
        await logSecurityEvent(client, "EMOJI_DELETE", entry.executor, emoji, {
          emoji: emoji.name,
          restored: !!emojiData
        });

        startBackupLoop(emoji.guild, client);
      }
    },

    {
      name: "webhooksUpdate",
      async execute(channel) {
        const logs = await channel.guild.fetchAuditLogs({ type: 50, limit: 1 }).catch(() => {});
        const entry = logs?.entries.first();
        if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

        const webhooks = await channel.fetchWebhooks().catch(() => {});
        for (const webhook of webhooks.values()) {
          if (webhook.owner?.id === entry.executor.id) {
            await webhook.delete().catch(() => {});
          }
        }

        await logAction(client, `🚨 ${entry.executor.tag}, **#${channel.name}** kanalına izinsiz webhook ekledi ve silindi.`, entry.executor.id);
        await dropPermissions(entry.executor);

        saveDetailedLog(entry.executor.tag, "Webhook Oluşturma", { channel: channel.name });
        await logSecurityEvent(client, "WEBHOOK_CREATE", entry.executor, channel, { channel: channel.name });
      }
    },

    {
      name: "guildUpdate",
      async execute(oldGuild, newGuild) {
        const logs = await newGuild.fetchAuditLogs({ type: 1, limit: 1 }).catch(() => {});
        const entry = logs?.entries.first();
        if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

        const changes = [];

        if (oldGuild.name !== newGuild.name) {
          await newGuild.setName(oldGuild.name).catch(() => {});
          changes.push(`🔤 Sunucu adı **"${newGuild.name}"** → **"${oldGuild.name}"** olarak geri alındı.`);
        }

        if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
          try {
            await newGuild.setVanityCode(oldGuild.vanityURLCode);
            changes.push(`🌐 Özel URL \`${newGuild.vanityURLCode}\` yerine \`${oldGuild.vanityURLCode}\` olarak geri alındı.`);
          } catch {
            changes.push(`⚠️ Özel URL geri alınamadı (yetersiz yetki).`);
          }
        }

        if (changes.length > 0) {
          await logAction(client, `⚠️ **${entry.executor.tag}**, sunucu ayarlarını değiştirdi:\n\n${changes.join("\n")}`, entry.executor.id);
          await dropPermissions(entry.executor);

          saveDetailedLog(entry.executor.tag, "Sunucu Ayarı Değişikliği", { changes });
          await logSecurityEvent(client, "GUILD_UPDATE", entry.executor, newGuild, { changes });

          startBackupLoop(newGuild, client);
        }
      }
    }

  ];

  // Olayları client.on ile bağla
  for (const event of events) {
    client.on(event.name, (...args) => event.execute(...args));
  }

  function startBackupLoop(guild, client) {
    if (!backupIntervalStarted) {
      backupIntervalStarted = true;
      console.log(`⏱️ [Yedekleme Başladı] ${client.user.username} için her 5 dakikada bir yedek alınacak.`);
      backupGuild(guild).catch(console.error);

      setInterval(() => {
        backupGuild(guild).catch(err => console.error("❌ Zamanlı yedekleme hatası:", err));
      }, 5 * 60 * 1000);
    }
  }

};
