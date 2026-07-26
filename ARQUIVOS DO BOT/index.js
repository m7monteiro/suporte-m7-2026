const Discord = require("discord.js")

const config = require("./config.json")

const client = new Discord.Client({ 
  intents: [ 
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers,
    '32767'
       ]
    });

module.exports = client

client.on('interactionCreate', (interaction) => {

  if(interaction.type === Discord.InteractionType.ApplicationCommand){

      const cmd = client.slashCommands.get(interaction.commandName);

      if (!cmd) return interaction.reply(`Error`);

      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

      cmd.run(client, interaction)

   }
})

client.on('ready', () => {
  console.log(`🔥 Estou online em ${client.user.username}!`)
})


client.slashCommands = new Discord.Collection()

require('./handler')(client)

client.login(process.env.DISCORD_TOKEN || config.token)

client.on("interactionCreate", require('./events/config-ticket').execute);
client.on("interactionCreate", require('./events/ticket').execute);
client.on("interactionCreate", require('./events/gerenciar').execute);

// Servidor web simples para manter o bot ativo no Render (via UptimeRobot)
const http = require('http');
http.createServer(function (req, res) {
  res.write("Bot is running!");
  res.end();
}).listen(process.env.PORT || 8080);
