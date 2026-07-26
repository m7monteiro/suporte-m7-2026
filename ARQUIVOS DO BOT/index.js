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

module.exports = client;

// Importar os handlers de eventos
const configTicketHandler = require('./events/config-ticket');
const ticketHandler = require('./events/ticket');
const gerenciarHandler = require('./events/gerenciar');

// UNIFICAÇÃO DE EVENTOS: Apenas UM listener para interactionCreate
// Antes o bot tinha 4 listeners diferentes, o que causava conflitos,
// múltiplas respostas para a mesma interação e o erro "não respondeu a tempo".
client.on('interactionCreate', async (interaction) => {
  try {
    // 1. Slash Commands
    if (interaction.type === Discord.InteractionType.ApplicationCommand) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) return interaction.reply({ content: "Erro: Comando não encontrado.", ephemeral: true });
      
      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);
      await cmd.run(client, interaction);
      return;
    }

    // 2. Componentes e Modals (Ticket System)
    // Chamamos os handlers em sequência, eles verificam o customId internamente.
    // Usamos Promise.all para processar de forma eficiente se necessário, 
    // mas aqui chamamos individualmente para manter a lógica original.
    
    await configTicketHandler.execute(interaction, null, client);
    await ticketHandler.execute(interaction, null, client);
    await gerenciarHandler.execute(interaction, null, client);

  } catch (err) {
    console.error("❌ Erro ao processar interação:", err);
    // Tenta avisar o usuário se algo deu muito errado e a interação ainda não foi respondida
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Ocorreu um erro interno ao processar esta ação.", ephemeral: true }).catch(() => {});
    }
  }
});

client.on('ready', () => {
  console.log(`🔥 Estou online em ${client.user.username}!`)
})

client.slashCommands = new Discord.Collection()

require('./handler')(client)

const token = process.env.DISCORD_TOKEN || config.token;
if (!token || token === "REPLACE_WITH_ENV_VAR" || token === "USE_ENVIRONMENT_VARIABLE_DISCORD_TOKEN") {
    console.error("❌ ERRO: Nenhum token do Discord foi fornecido!");
    process.exit(1);
}

console.log("🔑 Tentando login com token...");
client.login(token);

// Servidor web simples para manter o bot ativo no Render (via UptimeRobot)
const http = require('http');
http.createServer(function (req, res) {
  res.write("Bot is running!");
  res.end();
}).listen(process.env.PORT || 8080);
