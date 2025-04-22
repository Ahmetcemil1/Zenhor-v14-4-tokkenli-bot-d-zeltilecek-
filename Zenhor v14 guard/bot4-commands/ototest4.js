const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { isWhitelisted, logAction } = require("../sharedClient");
const { addLog } = require("../utils/logHistory");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger"); // varsa

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ototest4")
    .setDescription("🏛️ Sunucu ve Webhook koruma sistemini test eder."),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: 64 });

    const testUser = interaction.user;
    const guild = interaction.guild;
    const results = [];

    // 🔐 Whitelist kontrolü
    const isWhite = isWhitelisted(testUser.id);
    results.push(`🔐 Whitelist: ${isWhite ? "✅ Listede" : "❌ Değil"}`);
    addLog(`[OtoTest4] Whitelist: ${isWhite ? "Listede" : "Listede değil"} - ${testUser.tag}`);
    saveDetailedLog(testUser.tag, "Whitelist Kontrolü", { whitelist: isWhite });

    // 📢 logAction testi
    try {
      await logAction(client, "🧪 Bot4 logAction() testi", testUser.id);
      results.push("📢 logAction: ✅ Embed gönderildi");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarılı" });
    } catch (err) {
      results.push("📢 logAction: ❌ Gönderilemedi");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarısız", error: err.message });
    }

    // ✉️ DM testi
    try {
      await testUser.send("✅ Bot4 DM testi başarılı.");
      results.push("✉️ DM Gönderimi: ✅ Başarılı");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarılı" });
    } catch (err) {
      results.push("✉️ DM Gönderimi: ❌ Başarısız");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarısız", error: err.message });
    }

    // 📌 Event listener kontrolleri
    const events = {
      "guildUpdate": "🏷️ Sunucu Ayarı Koruması",
      "webhookUpdate": "🪝 Webhook Koruması",
      "emojiDelete": "😶 Emoji Silme Koruması"
    };

    for (const [event, label] of Object.entries(events)) {
      const count = client.rawListeners(event)?.length || 0;
      const status = count > 0 ? "✅ Çalışıyor" : "❌ Dinleyici yok";
      results.push(`${label}: ${status}`);
      saveDetailedLog(testUser.tag, "Event Listener Kontrolü", {
        event,
        label,
        aktif: count > 0
      });
    }

    // 🏷️ Sunucu adı simülasyonu
    try {
      const oldName = guild.name;
      const tempName = `${oldName}-test`;
      await guild.setName(tempName, "Simülasyon: Sunucu adı geçici değiştirildi");
      await guild.setName(oldName, "Simülasyon: Sunucu adı geri alındı");

      results.push("🏷️ Sunucu Adı Simülasyonu: ✅ Başarılı");
      saveDetailedLog(testUser.tag, "Sunucu Adı Simülasyonu", {
        success: true,
        oldName,
        newName: tempName
      });
    } catch (e) {
      results.push("🏷️ Sunucu Adı Simülasyonu: ❌ Hata");
      saveDetailedLog(testUser.tag, "Sunucu Adı Simülasyonu", {
        success: false,
        error: e.message
      });
    }

    // 🪝 Webhook oluştur/sil testi
    try {
      const testChannel = guild.channels.cache.find(channel =>
        channel.isTextBased?.() &&
        channel.permissionsFor?.(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
      );

      if (testChannel) {
        const webhook = await testChannel.createWebhook({
          name: "simülasyon-webhook",
          reason: "OtoTest4 Webhook Oluşturma Testi"
        });

        await webhook.delete("OtoTest4 Webhook Silme Testi");
        results.push("🪝 Webhook Simülasyonu: ✅ Oluştur/Sil başarılı");
        saveDetailedLog(testUser.tag, "Webhook Simülasyonu", {
          success: true,
          channel: testChannel.name,
          webhookId: webhook.id
        });
      } else {
        results.push("🪝 Webhook Simülasyonu: ❌ Uygun kanal bulunamadı");
        saveDetailedLog(testUser.tag, "Webhook Simülasyonu", {
          success: false,
          error: "Webhook oluşturulabilecek kanal bulunamadı"
        });
      }
    } catch (e) {
      results.push("🪝 Webhook Simülasyonu: ❌ Hata oluştu");
      saveDetailedLog(testUser.tag, "Webhook Simülasyonu", {
        success: false,
        error: e.message
      });
    }

    // 🧠 JSON loglama
    await logSecurityEvent?.(client, "OTO_TEST", testUser, testUser, {
      bot: client.user?.username,
      context: "ototest4.js",
      whitelist: isWhite,
      testedEvents: Object.keys(events)
    });

    const embed = new EmbedBuilder()
      .setTitle("🏛️ Sunucu Koruma OtoTest")
      .setDescription(results.join("\n"))
      .setColor("DarkGold")
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    addLog(`[OtoTest4] ${testUser.tag} oto test çalıştırdı.`);
  }
};
