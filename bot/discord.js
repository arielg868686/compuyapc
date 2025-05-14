const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const SocialMediaIntegrator = require('../index');
const Scheduler = require('../services/Scheduler');
const ErrorHandler = require('../services/ErrorHandler');
const FacebookBot = require('../facebook-bot');

class DiscordBot {
    constructor(token) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        this.token = token;
        this.integrator = new SocialMediaIntegrator();
        this.scheduler = new Scheduler();
        this.facebookBot = new FacebookBot();
        this.setupCommands();
    }

    setupCommands() {
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if (!message.content.startsWith('!social')) return;

            const args = message.content.slice(7).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            try {
                switch (command) {
                    case 'post':
                        await this.handlePost(message, args);
                        break;
                    case 'schedule':
                        await this.handleSchedule(message, args);
                        break;
                    case 'stats':
                        await this.handleStats(message, args);
                        break;
                    case 'help':
                        await this.handleHelp(message);
                        break;
                    case 'fb-groups':
                        await this.handleFacebookGroups(message, args);
                        break;
                    case 'fb-post-groups':
                        await this.handleFacebookPostGroups(message, args);
                        break;
                    case 'fb-search':
                        await this.handleFacebookSearch(message, args);
                        break;
                    case 'fb-campaign':
                        await this.handleFacebookCampaign(message, args);
                        break;
                    default:
                        await message.reply('Comando no reconocido. Usa !social help para ver los comandos disponibles.');
                }
            } catch (error) {
                await ErrorHandler.logError(error, { command, args });
                await message.reply('❌ Ocurrió un error al procesar el comando.');
            }
        });
    }

    async handlePost(message, args) {
        const content = args.join(' ');
        const attachments = message.attachments.map(a => a.url);

        const embed = new EmbedBuilder()
            .setTitle('Publicando en redes sociales...')
            .setDescription('Procesando tu publicación...')
            .setColor('#0099ff');

        const statusMessage = await message.reply({ embeds: [embed] });

        try {
            const results = await this.integrator.publishToAll(content, attachments);
            
            embed.setTitle('✅ Publicación completada')
                .setDescription('Resultados de la publicación:')
                .setColor('#00ff00');

            for (const [platform, result] of Object.entries(results)) {
                if (result) {
                    embed.addFields({
                        name: platform,
                        value: result.success ? '✅ Publicado' : `❌ Error: ${result.error}`
                    });
                }
            }

            await statusMessage.edit({ embeds: [embed] });
        } catch (error) {
            embed.setTitle('❌ Error en la publicación')
                .setDescription(`Error: ${error.message}`)
                .setColor('#ff0000');
            await statusMessage.edit({ embeds: [embed] });
        }
    }

    async handleSchedule(message, args) {
        if (args.length < 2) {
            return message.reply('Uso: !social schedule <fecha> <contenido>');
        }

        const date = new Date(args[0]);
        const content = args.slice(1).join(' ');
        const attachments = message.attachments.map(a => a.url);

        if (isNaN(date.getTime())) {
            return message.reply('❌ Fecha inválida. Usa el formato: YYYY-MM-DD HH:mm');
        }

        try {
            const postId = await this.scheduler.schedulePost({
                id: Date.now().toString(),
                content,
                media: attachments,
                platforms: ['facebook', 'instagram', 'twitter', 'telegram'],
                scheduleTime: date.toISOString(),
                timezone: 'America/Argentina/Buenos_Aires'
            });

            const embed = new EmbedBuilder()
                .setTitle('✅ Publicación programada')
                .setDescription(`ID: ${postId}\nFecha: ${date.toLocaleString()}`)
                .setColor('#00ff00');

            await message.reply({ embeds: [embed] });
        } catch (error) {
            await message.reply(`❌ Error al programar: ${error.message}`);
        }
    }

    async handleStats(message, args) {
        const platform = args[0]?.toLowerCase();
        if (!platform) {
            return message.reply('Uso: !social stats <plataforma>');
        }

        try {
            let stats;
            switch (platform) {
                case 'facebook':
                    stats = await this.integrator.getFacebookStats();
                    break;
                case 'instagram':
                    stats = await this.integrator.getInstagramStats();
                    break;
                case 'twitter':
                    stats = await this.integrator.getTwitterStats();
                    break;
                case 'telegram':
                    stats = await this.integrator.getTelegramStats();
                    break;
                default:
                    return message.reply('❌ Plataforma no válida');
            }

            const embed = new EmbedBuilder()
                .setTitle(`📊 Estadísticas de ${platform}`)
                .setColor('#0099ff')
                .addFields(
                    { name: 'Publicaciones', value: stats.posts.toString() },
                    { name: 'Seguidores', value: stats.followers.toString() },
                    { name: 'Interacciones', value: stats.engagement.toString() }
                );

            await message.reply({ embeds: [embed] });
        } catch (error) {
            await message.reply(`❌ Error al obtener estadísticas: ${error.message}`);
        }
    }

    async handleFacebookGroups(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Grupos de Facebook')
            .setColor('#1877F2');

        try {
            const groups = this.facebookBot.getGroups();
            
            if (groups.length === 0) {
                embed.setDescription('No se encontraron grupos.');
            } else {
                groups.forEach(([id, group]) => {
                    embed.addFields({
                        name: group.name,
                        value: `ID: ${id}\nMiembros: ${group.memberCount}\n${group.description || 'Sin descripción'}`
                    });
                });
            }

            await message.reply({ embeds: [embed] });
        } catch (error) {
            await message.reply(`❌ Error al obtener grupos: ${error.message}`);
        }
    }

    async handleFacebookPostGroups(message, args) {
        if (args.length < 1) {
            return message.reply('Uso: !social fb-post-groups <contenido> [grupo1,grupo2,...]');
        }

        const content = args.join(' ');
        const groupIds = message.content.match(/\[(.*?)\]/)?.[1]?.split(',') || [];

        const embed = new EmbedBuilder()
            .setTitle('📝 Publicando en grupos de Facebook...')
            .setDescription('Procesando tu publicación...')
            .setColor('#1877F2');

        const statusMessage = await message.reply({ embeds: [embed] });

        try {
            const results = await this.facebookBot.postToGroups(content, null, groupIds);
            
            embed.setTitle('✅ Publicación completada')
                .setDescription('Resultados de la publicación:')
                .setColor('#00ff00');

            results.forEach(result => {
                const group = this.facebookBot.getGroups().find(([id]) => id === result.groupId);
                embed.addFields({
                    name: group ? group[1].name : result.groupId,
                    value: result.success ? '✅ Publicado' : `❌ Error: ${result.error}`
                });
            });

            await statusMessage.edit({ embeds: [embed] });
        } catch (error) {
            embed.setTitle('❌ Error en la publicación')
                .setDescription(`Error: ${error.message}`)
                .setColor('#ff0000');
            await statusMessage.edit({ embeds: [embed] });
        }
    }

    async handleFacebookSearch(message, args) {
        if (args.length < 1) {
            return message.reply('Uso: !social fb-search <ubicación> [radio]');
        }

        const location = args[0];
        const radius = parseInt(args[1]) || 10;

        const embed = new EmbedBuilder()
            .setTitle('🔍 Buscando en Facebook...')
            .setDescription(`Buscando en ${location} (radio: ${radius}km)`)
            .setColor('#1877F2');

        const statusMessage = await message.reply({ embeds: [embed] });

        try {
            const results = await this.facebookBot.searchClientsByLocation(location, radius);
            
            embed.setTitle('✅ Búsqueda completada')
                .setDescription(`Resultados para ${location}:`)
                .setColor('#00ff00');

            if (results.groups.length > 0) {
                embed.addFields({
                    name: '👥 Grupos',
                    value: results.groups.map(g => `• ${g.name} (${g.member_count} miembros)`).join('\n')
                });
            }

            if (results.pages.length > 0) {
                embed.addFields({
                    name: '🏢 Páginas de Negocios',
                    value: results.pages.map(p => `• ${p.name} (${p.category})`).join('\n')
                });
            }

            if (results.events.length > 0) {
                embed.addFields({
                    name: '📅 Eventos',
                    value: results.events.map(e => `• ${e.name} (${new Date(e.start_time).toLocaleDateString()})`).join('\n')
                });
            }

            await statusMessage.edit({ embeds: [embed] });
        } catch (error) {
            embed.setTitle('❌ Error en la búsqueda')
                .setDescription(`Error: ${error.message}`)
                .setColor('#ff0000');
            await statusMessage.edit({ embeds: [embed] });
        }
    }

    async handleFacebookCampaign(message, args) {
        if (args.length < 1) {
            return message.reply('Uso: !social fb-campaign <crear|actualizar|estadísticas> [parámetros]');
        }

        const action = args[0].toLowerCase();
        const embed = new EmbedBuilder()
            .setTitle('📊 Campaña de Facebook')
            .setColor('#1877F2');

        try {
            switch (action) {
                case 'crear':
                    if (args.length < 4) {
                        return message.reply('Uso: !social fb-campaign crear <nombre> <objetivo> <presupuesto>');
                    }
                    const campaignId = await this.facebookBot.createCampaign(args[1], args[2], parseFloat(args[3]));
                    embed.setDescription(`✅ Campaña creada con ID: ${campaignId}`);
                    break;

                case 'actualizar':
                    if (args.length < 3) {
                        return message.reply('Uso: !social fb-campaign actualizar <id> <estado>');
                    }
                    await this.facebookBot.updateCampaign(args[1], { status: args[2] });
                    embed.setDescription('✅ Campaña actualizada');
                    break;

                case 'estadísticas':
                    if (args.length < 2) {
                        return message.reply('Uso: !social fb-campaign estadísticas <id>');
                    }
                    const stats = await this.facebookBot.getCampaignStats(args[1]);
                    embed.setDescription('📊 Estadísticas de la campaña:')
                        .addFields(
                            { name: 'Impresiones', value: stats.impressions.toString() },
                            { name: 'Alcance', value: stats.reach.toString() },
                            { name: 'Clics', value: stats.clicks.toString() },
                            { name: 'Gasto', value: `$${stats.spend}` }
                        );
                    break;

                default:
                    return message.reply('Acción no válida. Use: crear, actualizar o estadísticas');
            }

            await message.reply({ embeds: [embed] });
        } catch (error) {
            await message.reply(`❌ Error: ${error.message}`);
        }
    }

    async handleHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Comandos del Bot')
            .setColor('#0099ff')
            .setDescription('Lista de comandos disponibles:')
            .addFields(
                { name: 'Comandos Generales', value: 
                    '!social post <contenido> - Publica contenido en todas las redes\n' +
                    '!social schedule <fecha> <contenido> - Programa una publicación\n' +
                    '!social stats <plataforma> - Muestra estadísticas\n' +
                    '!social help - Muestra esta ayuda'
                },
                { name: 'Comandos de Facebook', value: 
                    '!social fb-groups - Lista grupos disponibles\n' +
                    '!social fb-post-groups <contenido> [grupo1,grupo2,...] - Publica en grupos\n' +
                    '!social fb-search <ubicación> [radio] - Busca clientes por ubicación\n' +
                    '!social fb-campaign crear <nombre> <objetivo> <presupuesto> - Crea campaña\n' +
                    '!social fb-campaign actualizar <id> <estado> - Actualiza campaña\n' +
                    '!social fb-campaign estadísticas <id> - Muestra estadísticas'
                }
            )
            .setFooter({ text: 'Puedes adjuntar imágenes o videos a tus mensajes' });

        await message.reply({ embeds: [embed] });
    }

    start() {
        this.client.login(this.token);
        console.log('Bot de Discord iniciado');
    }
}

module.exports = DiscordBot; 