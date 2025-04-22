const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yedek-sil")
    .setDescription("🗑️ Mevcut yedek dosyalarını siler."),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 🔒 Yetki kontrolü
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.editReply("❌ Bu komutu kullanmak için `Yönetici (Administrator)` iznine sahip olmalısınız.");
    }

    const guildId = interaction.guild.id;
    const backupDir = path.join(__dirname, "..", "..", "backups", guildId);

    try {
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
        await interaction.editReply("✅ Bu sunucuya ait tüm yedekler başarıyla silindi.");
      } else {
        await interaction.editReply("⚠️ Bu sunucuya ait silinecek bir yedek bulunamadı.");
      }
    } catch (err) {
      console.error("❌ Yedek silme hatası:", err);
      await interaction.editReply("❌ Yedek dosyaları silinirken bir hata oluştu.");
    }
  }
};
