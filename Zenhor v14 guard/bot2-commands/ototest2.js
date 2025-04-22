const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { isWhitelisted, logAction } = require("../sharedClient");
const { addLog } = require("../utils/logHistory");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger"); // varsa

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ototest2")
    .setDescription("🎭 Rol koruma sistemini test eder."),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: 64 });

    const testUser = interaction.user;
    const guild = interaction.guild;
    const results = [];

    // 🔐 Whitelist kontrolü
    const isWhite = isWhitelisted(testUser.id);
    results.push(`🔐 Whitelist: ${isWhite ? "✅ Listede" : "❌ Değil"}`);
    addLog(`[OtoTest2] Whitelist: ${isWhite ? "Listede" : "Listede değil"} - ${testUser.tag}`);
    saveDetailedLog(testUser.tag, "Whitelist Kontrolü", { whitelist: isWhite });

    // 📢 logAction testi
    try {
      await logAction(client, "🧪 Bot2 logAction() testi", testUser.id);
      results.push("📢 logAction: ✅ Embed gönderildi");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarılı" });
    } catch (err) {
      results.push("📢 logAction: ❌ Hata");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarısız", error: err.message });
    }

    // ✉️ DM testi
    try {
      await testUser.send("✅ Bot2 DM testi başarılı.");
      results.push("✉️ DM Gönderimi: ✅ Başarılı");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarılı" });
    } catch (err) {
      results.push("✉️ DM Gönderimi: ❌ Başarısız");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarısız", error: err.message });
    }

    // 📌 Event listener kontrolleri
    const events = {
      "roleCreate": "🆕 Rol Oluşturma Engellemesi",
      "roleDelete": "🗑️ Rol Silinme Koruması",
      "roleUpdate": "🔧 Rol Güncelleme Koruması"
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

    // 🧪 Gerçekçi Simülasyon (create → update → delete)
    try {
      const simRole = await guild.roles.create({
        name: "🔬 ototest-rol",
        permissions: [PermissionsBitField.Flags.Administrator],
        reason: "OtoTest2: Rol Oluşturma Simülasyonu"
      });

      const originalName = simRole.name;

      await simRole.setName("🔧 ototest-güncelleme", "OtoTest2: Güncelleme Simülasyonu");
      await simRole.delete("OtoTest2: Rol Silme Simülasyonu");

      results.push("🧪 Gerçekçi Rol Simülasyonu: ✅ Başarılı");
      saveDetailedLog(testUser.tag, "Gerçekçi Rol Simülasyonu", {
        originalName,
        tested: ["create", "update", "delete"],
        success: true
      });
    } catch (err) {
      results.push("🧪 Gerçekçi Rol Simülasyonu: ❌ Hata oluştu");
      saveDetailedLog(testUser.tag, "Gerçekçi Rol Simülasyonu", {
        success: false,
        error: err.message
      });
    }

    // 📂 JSON loglama (gizli log)
    await logSecurityEvent?.(client, "OTO_TEST", testUser, testUser, {
      bot: client.user?.username,
      context: "ototest2.js",
      whitelist: isWhite,
      testedEvents: Object.keys(events)
    });

    const embed = new EmbedBuilder()
      .setTitle("🎭 Rol Koruma OtoTest")
      .setDescription(results.join("\n"))
      .setColor("DarkPurple")
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    addLog(`[OtoTest2] ${testUser.tag} oto test çalıştırdı.`);
  }
};
