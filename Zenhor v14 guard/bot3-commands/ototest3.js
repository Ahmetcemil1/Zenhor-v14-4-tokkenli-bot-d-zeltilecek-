const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
const { isWhitelisted, logAction } = require("../sharedClient");
const { addLog } = require("../utils/logHistory");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger"); // varsa

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ototest3")
    .setDescription("📁 Kanal koruma sistemini test eder."),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: 64 });

    const testUser = interaction.user;
    const guild = interaction.guild;
    const results = [];

    // 🔐 Whitelist kontrolü
    const isWhite = isWhitelisted(testUser.id);
    results.push(`🔐 Whitelist: ${isWhite ? "✅ Listede" : "❌ Değil"}`);
    addLog(`[OtoTest3] Whitelist: ${isWhite ? "Listede" : "Listede değil"} - ${testUser.tag}`);
    saveDetailedLog(testUser.tag, "Whitelist Kontrolü", { whitelist: isWhite });

    // 📢 logAction testi
    try {
      await logAction(client, "🧪 Bot3 logAction() testi", testUser.id);
      results.push("📢 logAction: ✅ Embed gönderildi");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarılı" });
    } catch (err) {
      results.push("📢 logAction: ❌ Gönderilemedi");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarısız", error: err.message });
    }

    // ✉️ DM testi
    try {
      await testUser.send("✅ Bot3 DM testi başarılı.");
      results.push("✉️ DM Gönderimi: ✅ Başarılı");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarılı" });
    } catch (err) {
      results.push("✉️ DM Gönderimi: ❌ Başarısız");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarısız", error: err.message });
    }

    // 📌 Event listener kontrolleri
    const events = {
      "channelCreate": "🆕 Kanal Oluşturma Koruması",
      "channelDelete": "🗑️ Kanal Silinme Koruması"
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

    // 🧪 Gerçekçi Kanal Simülasyonu (Oluştur → Sil)
    try {
      const simChannel = await guild.channels.create({
        name: "📂 ototest-kanal",
        type: ChannelType.GuildText,
        reason: "OtoTest3: Kanal oluşturma simülasyonu"
      });

      const channelId = simChannel.id;

      await simChannel.delete("OtoTest3: Kanal silme simülasyonu");

      results.push("🧪 Gerçek Kanal Simülasyonu: ✅ Oluştur/Sil işlemleri başarılı");
      saveDetailedLog(testUser.tag, "Gerçek Kanal Simülasyonu", {
        channelId,
        tested: ["create", "delete"],
        success: true
      });
    } catch (err) {
      results.push("🧪 Gerçek Kanal Simülasyonu: ❌ Hata oluştu");
      saveDetailedLog(testUser.tag, "Gerçek Kanal Simülasyonu", {
        success: false,
        error: err.message
      });
    }

    // 📂 JSON loglama (logSecurityEvent opsiyonel kontrol)
    await logSecurityEvent?.(client, "OTO_TEST", testUser, testUser, {
      bot: client.user?.username,
      context: "ototest3.js",
      whitelist: isWhite,
      testedEvents: Object.keys(events)
    });

    const embed = new EmbedBuilder()
      .setTitle("📁 Kanal Koruma OtoTest")
      .setDescription(results.join("\n"))
      .setColor("DarkOrange")
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    addLog(`[OtoTest3] ${testUser.tag} oto test komutunu kullandı.`);
  }
};
