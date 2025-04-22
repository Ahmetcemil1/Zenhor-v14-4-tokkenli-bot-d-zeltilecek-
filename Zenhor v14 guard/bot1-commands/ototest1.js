const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isWhitelisted, logAction, dropPermissions } = require("../sharedClient");
const { addLog } = require("../utils/logHistory");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger"); // varsa

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ototest1")
    .setDescription("👤 Member koruma sistemini test eder."),

  async execute(interaction, client) {
    // Log kanal adı varsayılanla garanti altına alınır
    if (!client.logChannelName) client.logChannelName = "guard-log";

    await interaction.deferReply({ flags: 64 });

    const testUser = interaction.user;
    const member = await interaction.guild.members.fetch(testUser.id).catch(() => null);
    const results = [];

    // 🔐 Whitelist kontrolü
    const isWhite = isWhitelisted(testUser.id);
    results.push(`🔐 Whitelist: ${isWhite ? "✅ Kullanıcı listede" : "❌ Listede değil"}`);
    addLog(`[OtoTest1] Whitelist: ${isWhite ? "Listede" : "Listede değil"} - ${testUser.tag}`);
    saveDetailedLog(testUser.tag, "Whitelist Kontrolü", { whitelist: isWhite });

    // ✉️ DM testi
    try {
      await testUser.send("✅ DM testi başarılı (Bot1).");
      results.push("✉️ DM Gönderimi: ✅ Başarılı");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarılı" });
    } catch (e) {
      results.push("✉️ DM Gönderimi: ❌ Başarısız");
      saveDetailedLog(testUser.tag, "DM Testi", { status: "Başarısız", error: e.message });
    }

    // 📢 logAction testi
    try {
      await logAction(client, "🧪 Bot1 logAction() test mesajı", testUser.id);
      results.push("📢 logAction: ✅ Embed gönderildi");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Başarılı" });
    } catch (e) {
      results.push("📢 logAction: ❌ Hata");
      saveDetailedLog(testUser.tag, "logAction Testi", { status: "Hata", error: e.message });
    }

    // 🛡️ dropPermissions testi
    if (member && member.roles) {
      const oldRoles = [...member.roles.cache.keys()];
      try {
        await dropPermissions(member);
        results.push("🛡️ dropPermissions: ✅ Roller alındı");
        saveDetailedLog(testUser.tag, "dropPermissions Testi", { result: "Roller alındı" });

        // Rolleri geri yükle
        for (const roleId of oldRoles) {
          const role = interaction.guild.roles.cache.get(roleId);
          if (role) await member.roles.add(role).catch(() => {});
        }
      } catch (e) {
        results.push("🛡️ dropPermissions: ❌ Hata");
        saveDetailedLog(testUser.tag, "dropPermissions Testi", { result: "Hata", error: e.message });
      }
    }

    // 🔁 Event listener kontrolü
    const memberEvents = ["guildBanAdd", "guildBanRemove", "guildMemberRemove", "guildMemberUpdate"];
    for (const e of memberEvents) {
      const count = client.rawListeners(e)?.length || 0;
      const status = count > 0 ? "✅ Var" : "❌ Yok";
      results.push(`🔁 ${e}: ${status}`);
      saveDetailedLog(testUser.tag, "Event Listener Kontrolü", {
        event: e,
        aktif: count > 0
      });
    }

    // 🚪 Simülasyon Kickleme
    if (member && member.kickable) {
      try {
        await member.kick("🧪 OtoTest Simülasyonu");
        results.push("🚪 Simülasyon Kickleme: ✅ Simüle Edildi");
        saveDetailedLog(testUser.tag, "Simülasyon Kickleme", { success: true });
      } catch (e) {
        results.push("🚪 Simülasyon Kickleme: ❌ Başarısız");
        saveDetailedLog(testUser.tag, "Simülasyon Kickleme", { success: false, error: e.message });
      }
    } else {
      results.push("🚪 Simülasyon Kickleme: ❌ Kullanıcı kicklenemez");
      saveDetailedLog(testUser.tag, "Simülasyon Kickleme", { success: false, reason: "kickable değil" });
    }

    // 📁 JSON log kaydı
    await logSecurityEvent?.(client, "OTO_TEST", testUser, testUser, {
      bot: client.user?.username,
      context: "ototest1.js",
      whitelist: isWhite,
      testedEvents: memberEvents
    });

    // ✅ Son embed
    const embed = new EmbedBuilder()
      .setTitle("👤 Member Koruma OtoTest")
      .setDescription(results.join("\n"))
      .setColor("Blue")
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    addLog(`[OtoTest1] ${testUser.tag} oto test çalıştırdı.`);
  }
};
