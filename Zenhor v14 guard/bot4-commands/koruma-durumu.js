const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("koruma-durumu")
    .setDescription("Botların görev dağılımını ve aktif korumaları gösterir."),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64  });

    // Bu sadece örnek, burada kendi sisteminden görev dağılımı çekilebilir
    const duties = [
      { bot: "Bot 1", görev: "Kanal & Oda Koruma" },
      { bot: "Bot 2", görev: "Rol Koruma" },
      { bot: "Bot 3", görev: "Üye & Ban Koruma" },
      { bot: "Bot 4", görev: "URL & Emoji Koruma" }
    ];

    const msg = duties.map(d => `🤖 **${d.bot}** → ${d.görev}`).join("\n");

    interaction.editReply({
      content: `🔒 **Aktif Koruma Durumu**:\n\n${msg}`
    });
  }
};