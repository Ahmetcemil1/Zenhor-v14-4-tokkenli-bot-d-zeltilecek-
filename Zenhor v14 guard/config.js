module.exports = {
  guildId: "1361793699520053328",
  voiceChannelId: "1361793699520053332",
  ownerIds: ["1253466679753834600"],

  bots: [
    {
      name: "Bot1",
      token: "MTM2MzA5NjUyOTIxNjQ3MTE1MQ.GnHvh1.e95ZB8SRHbiOkGdHAaaKFXOnXYQ1Aas7m8RfXA",
      clientId: "1363096529216471151",
      guildId: "1361793699520053328",
      duty: "member",
      commandsFolder: "bot1-commands",
      logChannelName: "member-log"
    },
    {
      name: "Bot2",
      token: "MTM2MzA5NjcwNDA4OTQ2MDg3Ng.GCBcaq.ED5NNDtpcsrNpzQJD3haJc7oUp5LCrISRSdg78",
      clientId: "1363096704089460876",
      guildId: "1361793699520053328",
      duty: "role",
      commandsFolder: "bot2-commands",
      logChannelName: "role-log"
    },
    {
      name: "Bot3",
      token: "MTM2MzA5Njk2MDIzNTczNzIxOQ.G0kNFX.IlVOBPACzOB2zRBiW0ZM4dO5Yp8ffe8MV9w99E",
      clientId: "1363096960235737219",
      guildId: "1361793699520053328",
      duty: "channel",
      commandsFolder: "bot3-commands",
      logChannelName: "channel-log"
    },
    {
      name: "Bot4",
      token: "MTM2MzA5NzExODIzNTE2NDgwMg.GHQQGL.kQdz5lEDNNDxQVIEb1kub91BAVxQ1q5nUzFSXk",
      clientId: "1363097118235164802",
      guildId: "1361793699520053328",
      duty: "guild",
      commandsFolder: "bot4-commands",
      logChannelName: "guild-log"
    }
  ],

  systems: {
    permissionDrop: true,
    intelligentBlock: true,
    roleHierarchy: true,
    testMode: false,
    logToUserDM: true,
    logToChannel: true
  },

  botIntents: [
    "Guilds",
    "GuildMembers",
    "GuildBans",
    "GuildEmojisAndStickers",
    "GuildIntegrations",
    "GuildWebhooks",
    "GuildInvites",
    "GuildVoiceStates",
    "GuildMessages",
    "MessageContent",
    "GuildMessageReactions",
    "GuildPresences",
    "DirectMessages"
  ]
};