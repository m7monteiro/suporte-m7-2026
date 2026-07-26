const Discord = require("discord.js");
const config1 = require("../config.json");
const ticket = require("../json/config.ticket.json");
const { QuickDB } = require("quick.db");
const db = new QuickDB({ table: "ticket" });
const randomString = require("randomized-string");
const fs = require('fs');
const path = require('path');

// BUG 1 CORRIGIDO: Caminhos absolutos para os arquivos JSON
// Antes usava caminhos relativos como 'json/logs.json' que quebravam
// dependendo do diretório de onde o processo era iniciado.
const assumedFilePath = path.join(__dirname, "..", "json", "assumidos.json");
const logsFilePath = path.join(__dirname, "..", "json", "logs.json");
const configTicketPath = path.join(__dirname, "..", "json", "config.ticket.json");

function readAssumedData() {
  try {
    const data = fs.readFileSync(assumedFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}
function saveAssumedData(data) {
  fs.writeFileSync(assumedFilePath, JSON.stringify(data, null, 4), "utf8");
}


module.exports = {
    name: 'ticket',
    async execute(interaction, message, client) {
        let config;
        try {
            const rawData = fs.readFileSync(configTicketPath);
            config = JSON.parse(rawData);
        } catch (err) {
            console.error("❌ Erro ao ler config.ticket.json:", err);
            return;
        }


        if(interaction.customId === "abrir-ticket") {
            const cleanUsername = interaction.user.username
      .toLowerCase()
      .replace(/[\s._]/g, "");
  
    const channel = interaction.guild.channels.cache.find(
      (c) => c.name === `🎫-${cleanUsername}`
    );
  
    if (channel)
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
          .setColor("#ce717b")
            .setDescription(
              `${interaction.user} Você já possui um ticket aberto em ${channel}.`
            ),
        ],
        components: [
          new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setLabel("Ir para o seu Ticket")
                .setStyle(Discord.ButtonStyle.Link)
                .setURL(channel.url)
            ),
        ],
        ephemeral: true,
      });

            const modal = new Discord.ModalBuilder().setCustomId("modal_ticket").setTitle("Descreva o motivo do ticket")

            const text = new Discord.TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("Descreva o motivo do ticket")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(1)

            modal.addComponents(new Discord.ActionRowBuilder().addComponents(text))
            
            return interaction.showModal(modal)
        }

        if(interaction.isModalSubmit() && interaction.customId === "modal_ticket"){
            const motivo = interaction.fields.getTextInputValue("motivo");
            const permissionOverwrites = [
                {
                  id: interaction.guild.id,
                  deny: ["ViewChannel"],
                },
                {
                  id: interaction.user.id,
                  allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                },
                {
                  id: ticket.config_principais.cargo_staff,
                  allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                },
              ];


              await interaction.reply({
                content:`Seu Ticket está sendo aberto, aguarde...`,
                ephemeral:true
              })


              await db.add(`quantiaticket_${interaction.user.id}`, 1)
              
              const abc = await db.get(`quantiaticket_${interaction.user.id}`)
              var randomToken = randomString
              .generate({ length: 6, charset: "hex" })
              .toUpperCase();
        
              const aaaaa = randomToken
              
              const cargo_staff = interaction.guild.roles.cache.get(ticket.config_principais.cargo_staff)
              // BUG 2 CORRIGIDO: Removido o .then() encadeado no channels.create
              // O código misturava async/await com .then(), causando comportamento
              // imprevisível e erros de "interaction already replied".
              const channels = await interaction.guild.channels.create({
                name: `🎫-${interaction.user.username}`,
                type: 0,
                parent: ticket.config_principais.category_ticket,
                topic: interaction.user.id,
                permissionOverwrites: permissionOverwrites,
              });

              await interaction.editReply({
                  content:`${interaction.user} Seu Ticket foi aberto no canal: ${channels.url}`,
                  components:[
                      new Discord.ActionRowBuilder()
                      .addComponents(
                          new Discord.ButtonBuilder()
                          .setStyle(5)
                          .setURL(channels.url)
                          .setLabel("Ir para o ticket")
                      )
                  ]
              });

              const user = interaction.user;

              await db.set(`ticket_${channels.id}`, {
                  usuario:interaction.user.id,
                  motivo:motivo,
                  codigo:aaaaa,
                  staff:"Ninguem Assumiu"
                });

              function substituirVariaveis(texto, user, motivo, aaaaa) {
                  return texto
                      .replace('{user}', user)
                      .replace('{motivo}', motivo)
                      .replace('{assumido}', `Ninguem assumiu`)
                      .replace('{codigo}', aaaaa);
              }

              const embeds = new Discord.EmbedBuilder()
              .setDescription(substituirVariaveis(config.config_dentro.texto, user, motivo, aaaaa));
              
              if(ticket.config_dentro.thumbnail){
                  embeds.setImage(`${ticket.config_dentro.thumbnail}`);
              }

              await channels.send({
                  content:`||${cargo_staff} - ${interaction.user}||`,
                  embeds:[
                      embeds
                  ],
                  components:[
                      new Discord.ActionRowBuilder()
                      .addComponents(
                          new Discord.ButtonBuilder()
                          .setCustomId("sair_ticket")
                          .setLabel("Sair do ticket")
                          .setStyle(Discord.ButtonStyle.Danger),
                          new Discord.ButtonBuilder()
                          .setCustomId("painel_member")
                          .setLabel("Painel Membro")
                          .setStyle(2),
                          new Discord.ButtonBuilder()
                          .setCustomId("painel_staff")
                          .setLabel("Painel Staff")
                          .setStyle(2),
                          new Discord.ButtonBuilder()
                          .setCustomId("ticket_assumir")
                          .setLabel("Assumir Ticket")
                          .setStyle(3),
                          new Discord.ButtonBuilder()
                          .setCustomId("finalization_ticket")
                          .setLabel("Finalizar Ticket")
                          .setStyle(Discord.ButtonStyle.Danger),
                      )
                  ]
              });

              const chanal = interaction.guild.channels.cache.get(ticket.config_principais.channel_logs);
              if(!chanal) return;
              await chanal.send({
                  content:"Novo Ticket Aberto",
                  embeds:[
                      new Discord.EmbedBuilder()
                      .addFields(
                          {
                              name:"👥 Usuario",
                              value:`${interaction.user} \`${interaction.user.id}\``,
                              inline:true
                          },
                          {
                              name:"🎫 Ticket",
                              value:`${channels.url}`,
                              inline:true
                          },
                          {
                              name:"🔰 Tickets Abertos",
                              value: `${abc}`,
                              inline:true
                          },
                          {
                              name:"🔐 Codigo do ticket",
                              value: `\`${aaaaa}\``,
                              inline:true
                          },
                          {
                              name:"⚠ Motivo do Ticket",
                              value: `\`${motivo}\``,
                              inline:true
                          },
                          
                      )
                  ]
              });
        }


        if(interaction.customId === "painel_staff"){
          const user1 = interaction.guild.members.cache.get(interaction.user.id);
          const roleIdToCheck = ticket.config_principais.cargo_staff;
        
          const hasRequiredRole = user1.roles.cache.has(roleIdToCheck);
        
          if (!hasRequiredRole) {
            await interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
            return;
          }
            interaction.reply({
                content:`${interaction.user}`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .setDescription("✅ | Painel Staff Aberto com Sucesso!")
                ], 
                ephemeral:true,
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                        .setCustomId("painelstaff")
                        .setPlaceholder("Escolha alguma opção")
                        .addOptions(
                            {
                                label:"Chamar Usuario",
                                description:"Notifique o usuario",
                                value:"Cham_User",
                            },
                            {
                                label:"Adicionar um usuario",
                                description:"Adicione um usuario!",
                                value:"add_user",
                            },
                            {
                                label:"Remova um usuario",
                                description:"Remova um usuario do ticket!",
                                value:"remove_user",
                            },
                        )
                    )
                ]
            })
        }

        if(interaction.isStringSelectMenu() && interaction.customId === "painelstaff"){
            const options = interaction.values[0]
            const tickets = await db.get(`ticket_${interaction.channel.id}`) 
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo
            const staff = interaction.guild.members.cache.get(tickets.staff)

            if(options === "Cham_User"){
                // BUG 3 CORRIGIDO: Adicionado try/catch ao enviar DM
                // O bot crashava se o usuário tivesse DMs desativadas.
                try {
                    await user.send({
                        content:`O Staff ${interaction.user}, está lhe chamando, veja o motivo no ticket: ${interaction.channel.url}`,
                        components:[
                            new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                .setLabel("Ir para o ticket")
                                .setStyle(5)
                                .setURL(interaction.channel.url)
                            )
                        ]
                    });
                } catch (e) {
                    console.warn(`⚠ Não foi possível enviar DM para ${user.user.tag}: DMs desativadas.`);
                }

                interaction.reply({
                    content:`Usuario está notificado`,
                    ephemeral:true
                })
            }



            if(options === "add_user"){

                interaction.update({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        `👤 | Marce ou envie o ID do usuário que você deseja adicionar!`
                      ),
                    ],
                    components: [],
                    ephemeral: true,
                  });
          
                  const filter = (i) => i.member.id === interaction.user.id;
                  const collector = interaction.channel.createMessageCollector({
                    filter,
                  });
          
                  collector.on("collect", async (collect) => {
                    const user_content = collect.content;
                    collect.delete();
          
                    const user_collected =
                      interaction.guild.members.cache.get(user_content);
          
                    if (!user_collected)
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            `Não foi possível encontrar o usuário \`${user_content}\`, tente novamente!`
                          ),
                        ],
                        components: [],
                        ephemeral: true,
                      });
          
                    if (
                      interaction.channel
                        .permissionsFor(user_collected.id)
                        .has("ViewChannel")
                    )
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            `O usuário ${user_collected}(\`${user_collected.id}\`) já possui acesso ao ticket!`
                          ),
                        ],
                        components: [],
                        ephemeral: true,
                      });
          
                    const permissionOverwrites = [
                        {
                          id: interaction.guild.id,
                          deny: ["ViewChannel"],
                        },
                        {
                          id: user.id,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                          ],
                        },
                        {
                          id: user_collected.id,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                        {
                          id: ticket.config_principais.cargo_staff,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                    ];

                    await interaction.channel.edit({
                      permissionOverwrites: permissionOverwrites,
                    });
          
                    interaction.editReply({
                      embeds: [
                        new Discord.EmbedBuilder().setDescription(
                          `O usuário ${user_collected}(\`${user_collected.id}\`) foi adicionado com sucesso!`
                        ),
                      ],
                      components: [],
                      ephemeral: true,
                    });
          
                    collector.stop();
                  });
            }



            if(options === "remove_user"){

                interaction.update({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        `👤 | Marce ou envie o ID do usuário que você deseja remover!`
                      ),
                    ],
                    components: [],
                    ephemeral: true,
                  });
          
                  const filter = (i) => i.member.id === interaction.user.id;
                  const collector = interaction.channel.createMessageCollector({
                    filter,
                  });
          
                  collector.on("collect", async (collect) => {
                    const user_content = collect.content;
                    collect.delete();
          
                    const user_collected =
                      interaction.guild.members.cache.get(user_content);
          
                    if (!user_collected)
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            `Não foi possível encontrar o usuário \`${user_content}\`, tente novamente!`
                          ),
                        ],
                        components: [],
                        ephemeral: true,
                      });
          
                    if (
                      !interaction.channel
                        .permissionsFor(user_collected.id)
                        .has("ViewChannel")
                    )
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            ` O usuário ${user_collected}(\`${user_collected.id}\`) não possui acesso ao ticket!`
                          ),
                        ],
                        components: [],
                        ephemeral: true,
                      });

                      const cargoIDs = ticket.config_principais.cargo_staff;
                      // BUG 4 CORRIGIDO: Typo "denny" trocado por "deny"
                      // A permissão de remoção nunca funcionava pois "denny" não é
                      // uma permissão válida do Discord.js.
                      const permissionOverwrites = [
                        {
                          id: interaction.guild.id,
                          deny: ["ViewChannel"],
                        },
                        {
                          id: user_collected.id,
                          deny: ["ViewChannel"],
                        },
                        {
                          id: user.id,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                        {
                          id: cargoIDs,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                    ];
                    
                    await interaction.channel.edit({
                      permissionOverwrites: permissionOverwrites,
                    });
          
                    interaction.editReply({
                      embeds: [
                        new Discord.EmbedBuilder().setDescription(
                          `O usuário ${user_collected}(\`${user_collected.id}\`) foi removido com sucesso!`
                        ),
                      ],
                      components: [],
                      ephemeral: true,
                    });
          
                    collector.stop();
                  });
            }
        }


        if(interaction.customId === "finalization_ticket"){
            const tickets = await db.get(`ticket_${interaction.channel.id}`)
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo
            const logs = interaction.guild.channels.cache.get(ticket.config_principais.channel_logs)
            const assumiu = interaction.guild.members.cache.get(tickets.staff)
            const assumiu1 = tickets.staff

            const user1 = interaction.guild.members.cache.get(interaction.user.id);
            const roleIdToCheck = ticket.config_principais.cargo_staff;
          
            const hasRequiredRole = user1.roles.cache.has(roleIdToCheck);
          
            if (!hasRequiredRole) {
              await interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
              return;
            }
            await interaction.reply({
                content:`Este Ticket será finalizado em alguns segundos...`
            });

            if(logs) {
                await logs.send({
                    content:"Ticket Finalizado",
                    embeds:[
                        new Discord.EmbedBuilder()
                        .addFields(
                            {
                                name:`Dono Ticket`,
                                value:`${user}`,
                                inline:true
                            },
                            {
                                name:`Quem Fechou`,
                                value:`${interaction.user}`,
                                inline:true
                            },
                            {
                                name:`Quem Assumiu?`,
                                value:`${assumiu ?? `Ninguem Assumiu`}`,
                                inline:true
                            },
                            {
                                name:`Motivo Ticket`,
                                value:`\`${motivo}\``,
                                inline:true
                            },
                            {
                                name:`Codigo Ticket`,
                                value:`\`${codigo}\``,
                                inline:true
                            }
                        )
                    ]
                });
            } else {
                console.log("⚠ Canal Logs não configurado");
            }

            // BUG 1 CORRIGIDO (continuação): Usando caminho absoluto para logs.json
            const lags = JSON.parse(fs.readFileSync(logsFilePath, 'utf-8'));

            const idDoUsuario = user.id;
            const newUserLog = {
              dono_ticket: idDoUsuario,
              fechou_ticket: interaction.user.id,
              assumido: assumiu1 ?? 'Ninguem assumiu',
              motivo: motivo,
              codigo: codigo,
            };
            
            if (!lags[idDoUsuario]) {
                lags[idDoUsuario] = [newUserLog];
            } else {
                lags[idDoUsuario].push(newUserLog);
            }
            
            // BUG 1 CORRIGIDO: Usando caminho absoluto
            fs.writeFileSync(logsFilePath, JSON.stringify(lags, null, 2), 'utf-8');

            // BUG 3 CORRIGIDO: Adicionado try/catch ao enviar DM de finalização
            try {
                await user.send({
                    content:"Ticket Finalizado",
                    embeds:[
                        new Discord.EmbedBuilder()
                        .addFields(
                            {
                                name:`Dono Ticket`,
                                value:`${user}`,
                                inline:true
                            },
                            {
                                name:`Quem Fechou`,
                                value:`${interaction.user}`,
                                inline:true
                            },
                            {
                                name:`Quem Assumiu?`,
                                value:`${assumiu ?? `Ninguem Assumiu`}`,
                                inline:true
                            },
                            {
                                name:`Motivo Ticket`,
                                value:`\`${motivo}\``,
                                inline:true
                            },
                            {
                                name:`Codigo Ticket`,
                                value:`\`${codigo}\``,
                                inline:true
                            }
                        )
                    ],
                    components:[
                        new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                            .setCustomId("avaliar_servidor")
                            .setLabel("Avalie o atendimento!")
                            .setEmoji("❤")
                            .setStyle(3)
                        )
                    ]
                });
            } catch (e) {
                console.warn(`⚠ Não foi possível enviar DM de finalização para ${user.user.tag}: DMs desativadas.`);
            }

            await db.set(`final_ticket_${user.id}`,{
                dono_ticket: idDoUsuario,
                fechou_ticket: interaction.user.id,
                assumido: assumiu1 ?? 'Ninguem assumiu',
                motivo: motivo,
                codigo: codigo,
            });

            // BUG 5 CORRIGIDO: setTimeout movido para o final, após todas as operações async
            // Antes o canal era deletado antes das operações de log/DM terminarem.
            setTimeout(() => {
                interaction.channel.delete();
            }, 5000);
        }


        if (interaction.customId === "avaliar_servidor") {
            const modal = new Discord.ModalBuilder().setCustomId("modal_avalia").setTitle("Avalie nosso atendimento")

            const text = new Discord.TextInputBuilder()
            .setCustomId("numero_avalia")
            .setLabel("Escolha de 1 a 5")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(1)
            .setMaxLength(1)
            .setValue("1")
            const desc = new Discord.TextInputBuilder()
            .setCustomId("desc_avalia")
            .setLabel("Diga mais sobre o nosso atendimento")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(2)
            .setValue("Gostei muito do atendimento, rápido e prático")

            modal.addComponents(new Discord.ActionRowBuilder().addComponents(text))
            modal.addComponents(new Discord.ActionRowBuilder().addComponents(desc))
            
            return interaction.showModal(modal)
        }

        if(interaction.isModalSubmit() && interaction.customId==="modal_avalia"){
            const num = interaction.fields.getTextInputValue("numero_avalia");
            const desc = interaction.fields.getTextInputValue("desc_avalia");
            const channel_avalia = interaction.client.channels.cache.get(ticket.config_principais.channel_avaliation);
            const tickets = await db.get(`final_ticket_${interaction.user.id}`)

            // BUG 6 CORRIGIDO: Verificação se o canal de avaliação existe antes de usar
            if (!channel_avalia) {
                return interaction.update({ content: "❌ Canal de avaliação não configurado.", components: [], embeds: [] });
            }

            // BUG 6 CORRIGIDO: Switch simplificado — os 5 cases repetiam o mesmo código
            // com apenas o texto da nota diferente. Unificado em lógica única.
            const notasValidas = ["1", "2", "3", "4", "5"];
            if (!notasValidas.includes(num)) {
                return interaction.reply({ content: `Escolha um número de 1 a 5`, ephemeral: true });
            }

            await interaction.update({ content: "Enviado com sucesso!", components: [], embeds: [] });
            await channel_avalia.send({
                content: "Nova avaliação",
                embeds: [
                    new Discord.EmbedBuilder()
                    .addFields({ name: `Usuario`, value: `${interaction.user}`, inline: true })
                    .addFields({ name: `Descrição`, value: `${desc}`, inline: true })
                    .addFields({ name: `Avaliação:`, value: `${num}/5 Estrelas`, inline: true })
                    .addFields({ name: `Quem Assumiu:`, value: `${interaction.client.users.cache.get(tickets.assumido) ?? "\`Ninguem assumiu\`"}`, inline: true })
                    .addFields({ name: `Codigo do ticket:`, value: `\`${tickets.codigo}\``, inline: true })
                    .addFields({ name: `Motivo:`, value: `\`${tickets.motivo}\``, inline: true })
                ]
            });
            await db.delete(`final_ticket_${interaction.user.id}`);
        }


        if(interaction.customId === "ticket_assumir"){
            const tickets = await db.get(`ticket_${interaction.channel.id}`)
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo

            const user1 = interaction.guild.members.cache.get(interaction.user.id);
            const roleIdToCheck = ticket.config_principais.cargo_staff;
        
            const hasRequiredRole = user1.roles.cache.has(roleIdToCheck);
        
            if (!hasRequiredRole) {
              await interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
              return;
            }

            await db.set(`ticket_${interaction.channel.id}`, {
                usuario:usuario,
                motivo:motivo,
                codigo:codigo,
                staff:interaction.user.id
            });

            const staffUserId = interaction.user.id;
            const assumedData = readAssumedData();
            if (!assumedData[staffUserId]) {
                assumedData[staffUserId] = 0;
            }
            assumedData[staffUserId]++;
            saveAssumedData(assumedData);

            function substituirVariaveis(texto, user, motivo, codigo) {
                return texto
                    .replace('{user}', user)
                    .replace('{motivo}', motivo)
                    .replace('{assumido}', `${interaction.user}`)
                    .replace('{codigo}', codigo);
            }

            const embeds = new Discord.EmbedBuilder()
            .setDescription(substituirVariaveis(config.config_dentro.texto, user, motivo, codigo));
            
            if(ticket.config_dentro.thumbnail){
                embeds.setImage(`${ticket.config_dentro.thumbnail}`);
            }
            
            // BUG 3 CORRIGIDO: Adicionado try/catch ao enviar DM de "ticket assumido"
            try {
                await user.send({
                    embeds:[
                        new Discord.EmbedBuilder()
                        .setDescription(`O Staff: ${interaction.user}, Assumiu seu ticket no canal: ${interaction.channel.url}`)
                    ],
                    components:[
                        new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                            .setLabel("Ir para o Ticket")
                            .setStyle(5)
                            .setURL(`${interaction.channel.url}`)
                        )
                    ]
                });
            } catch (e) {
                console.warn(`⚠ Não foi possível enviar DM para ${user.user.tag}: DMs desativadas.`);
            }

            await interaction.update({
                embeds:[
                    embeds
                ],
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId("sair_ticket")
                        .setLabel("Sair do ticket")
                        .setStyle(Discord.ButtonStyle.Danger),
                        new Discord.ButtonBuilder()
                        .setCustomId("painel_member")
                        .setLabel("Painel Membro")
                        .setStyle(2),
                        new Discord.ButtonBuilder()
                        .setCustomId("painel_staff")
                        .setLabel("Painel Staff")
                        .setStyle(2),
                        new Discord.ButtonBuilder()
                        .setCustomId("ticket_assumir")
                        .setLabel("Assumir Ticket")
                        .setDisabled(true)
                        .setStyle(3),
                        new Discord.ButtonBuilder()
                        .setCustomId("finalization_ticket")
                        .setLabel("Finalizar Ticket")
                        .setStyle(Discord.ButtonStyle.Danger),
                    )
                ]
            });

            const logs = interaction.guild.channels.cache.get(ticket.config_principais.channel_logs);
            if (!logs) return console.log("⚠ Canal de logs não configurado.");

            // BUG 1 CORRIGIDO: Usando o assumedData já carregado em memória
            // em vez de reler o arquivo do disco com caminho relativo.
            const quantidadeAssumido = assumedData[staffUserId];

            await logs.send({
                content:`Um Ticket foi assumido`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .addFields(
                        {
                            name:`Usuario`,
                            value:`${interaction.user}`,
                            inline:true
                        },
                        {
                            name:`Canal`,
                            value:`${interaction.channel.url}`,
                            inline:true
                        },
                        {
                            name:`Tickets assumidos`,
                            value:`${quantidadeAssumido}`,
                            inline:true
                        }
                    )
                ]
            });
        }


        if( interaction.customId === "painel_member"){
            interaction.reply({
                content:`${interaction.user}`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .setDescription("✅ | Painel Ticket Aberto com Sucesso!")
                ], 
                ephemeral:true,
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                        .setCustomId("painel_membro")
                        .setPlaceholder("Escolha alguma opção")
                        .addOptions(
                            {
                                label:"Chamar Staff",
                                description:"Chame algum staff!",
                                value:"Cham_Staff",
                            },
                            {
                                label:"Criar uma call",
                                description:"Crie uma call se for necessario!",
                                value:"call_create",
                            },
                            {
                                label:"Deletar sua call",
                                description:"Delete a call que foi criada!",
                                value:"del_call",
                            },
                        )
                    )
                ]
            })
        }

        if(interaction.isStringSelectMenu() && interaction.customId === "painel_membro"){
            const options = interaction.values[0]

            if(options === "Cham_Staff"){
                const tickets = await db.get(`ticket_${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const motivo = tickets.motivo
                const codigo = tickets.codigo
                const staff = interaction.guild.members.cache.get(tickets.staff)

                // BUG 7 CORRIGIDO: Verificação de permissão não retornava após responder
                // O código continuava executando e tentava dar reply duas vezes.
                if(interaction.user.id !== user.id) {
                    return interaction.reply({
                        content:`Só o usuario: ${user}, pode usar esta função`,
                        ephemeral: true
                    });
                }

                if(staff){
                    // BUG 3 CORRIGIDO: Adicionado try/catch ao enviar DM para staff
                    try {
                        await staff.send({
                            content:`O Usuario: ${interaction.user}, está lhe esperando no ticket: ${interaction.channel.url}`,
                            components:[
                                new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                    .setURL(interaction.channel.url)
                                    .setLabel("Ir para o Ticket")
                                    .setStyle(5)
                                )
                            ]
                        });
                    } catch (e) {
                        console.warn(`⚠ Não foi possível enviar DM para o staff: DMs desativadas.`);
                    }

                    interaction.reply({
                        content:`Enviado com sucesso`,
                        ephemeral:true
                    })
                } else {
                    interaction.reply({
                        content:`Ninguem assumiu seu ticket ainda!`,
                        ephemeral:true
                    })
                }
            }

            if (options === "call_create") {
                const channel_find = await interaction.guild.channels.cache.find(
                  (c) =>
                    c.name ===
                    `📞-${interaction.user.username.toLowerCase().replace(/ /g, "-")}`
                );
        
                if (channel_find)
                  return interaction.update({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        ` Você já possui uma call aberta em ${channel_find}`
                      ),
                    ],
                    components: [
                      new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                          .setStyle(5)
                          .setLabel("Entrar na call")
                          .setURL(channel_find.url)
                      ),
                    ],
                    ephemeral: true,
                  });
        
                const permissionOverwrites = [
                  {
                    id: interaction.guild.id,
                    deny: ["ViewChannel"],
                  },
                  {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                  },
                  {
                    id: ticket.config_principais.cargo_staff,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                  },
                ];
        
                const channel = await interaction.guild.channels.create({
                  name: `📞-${interaction.user.username
                    .toLowerCase()
                    .replace(/ /g, "-")}`,
                  type: 2,
                  parent: interaction.channel.parent,
                  permissionOverwrites: permissionOverwrites,
                });
        
                interaction.update({
                  embeds: [
                    new Discord.EmbedBuilder().setDescription(
                      `Call criada com sucesso em ${channel}`
                    ),
                  ],
                  components: [
                    new Discord.ActionRowBuilder().addComponents(
                      new Discord.ButtonBuilder()
                        .setStyle(5)
                        .setLabel("Entrar na call")
                        .setURL(channel.url)
                    ),
                  ],
                  ephemeral: true,
                });
            }

            if (options === "del_call") {
                const channel_find = await interaction.guild.channels.cache.find(
                  (c) =>
                    c.name ===
                    `📞-${interaction.user.username.toLowerCase().replace(/ /g, "-")}`
                );
        
                if (!channel_find)
                  return interaction.update({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        // BUG 8 CORRIGIDO: Texto confuso "Você não nenhuma possui"
                        // corrigido para "Você não possui nenhuma call aberta!"
                        `Você não possui nenhuma call aberta!`
                      ),
                    ],
                    components: [],
                    ephemeral: true,
                  });
        
                await channel_find.delete();
        
                interaction.update({
                  embeds: [
                    new Discord.EmbedBuilder().setDescription(
                      `Call deletada com sucesso!`
                    ),
                  ],
                  components: [],
                  ephemeral: true,
                });
            }
        }


        if(interaction.customId === "sair_ticket"){
            const tickets = await db.get(`ticket_${interaction.channel.id}`)
            const user = tickets.usuario
            if(user !== interaction.user.id){
                interaction.reply({
                    content:`Só quem pode sair é o usuario <@${user}>`,
                    ephemeral:true
                })
                return;
            }

            interaction.channel.edit({
                name:`closed-${interaction.user.username}`,
                permissionOverwrites: [
                    {
                  id: interaction.guild.id,
                  deny: ["ViewChannel"],
                },
                {
                    id: interaction.user.id,
                    deny: [
                      "ViewChannel",
                      "SendMessages",
                      "AttachFiles",
                      "AddReactions",
                    ],
                  },{
                    id: ticket.config_principais.cargo_staff,
                    allow: [
                      "ViewChannel",
                      "SendMessages",
                      "AttachFiles",
                      "AddReactions",
                    ],
                  },
                ],
              });

            interaction.reply({
                content:`<@&${ticket.config_principais.cargo_staff}>`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .setDescription("O Dono do ticket saiu, clique no botão abaixo para finalizar o ticket")
                ],
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId("finalization_ticket")
                        .setLabel("Finalizar Ticket")
                        .setStyle(Discord.ButtonStyle.Danger),
                    )
                ]
            })
        }

    }}
