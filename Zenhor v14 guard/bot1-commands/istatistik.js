const { SlashCommandBuilder } = require("discord.js");
const os = require("os");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("istatistik")
    .setDescription("Botların genel istatistiklerini gösterir."),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const uptime = Math.floor(process.uptime() / 60);

    const guild = interaction.guild;
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;
    const memberCount = guild.memberCount;

    const botCount = guild.members.cache.filter(m => m.user.bot).size;

    interaction.editReply({
      content: `📊 **Sunucu İstatistikleri:**
      
🔧 Aktif Bot Sayısı: **${botCount}**
👥 Üye Sayısı: **${memberCount}**
📁 Kanal Sayısı: **${channelCount}**
🔑 Rol Sayısı: **${roleCount}**
😄 Emoji Sayısı: **${emojiCount}**

🧪 Test Modu: \`${require("../config/testmode.json").enabled ? "Açık" : "Kapalı"}\`
🧠 RAM Kullanımı: ${(totalMem - freeMem).toFixed(2)} GB / ${totalMem} GB
⏱️ Çalışma Süresi: ${uptime} dakika
      `
    });
  }
};