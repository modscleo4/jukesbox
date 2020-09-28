const {Message, MessageEmbed} = require('discord.js');
const {adminID, startupTime} = require('../config');
const {pageEmbed} = require('../lib/utils');

module.exports = {
    botinfo: {
        description: 'Informações do bot.',
        only: [adminID],

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const subcommands = {
                servers: async () => {
                    const servers = message.client.guilds.cache.map((g, i) => ({
                        name: g.name,
                        value: `ID: ${g.id}`,
                    }));

                    return await pageEmbed(message, 'Servidores', servers);
                },
            };

            if (args[0] && args[0] in subcommands) {
                return await subcommands[args[0]]();
            }

            return await message.channel.send(new MessageEmbed()
                .setTitle('Admin')
                .setAuthor(message.client.user.username, message.client.user.avatarURL())
                .setTimestamp()
                .addFields([
                    {name: 'Servidores', value: message.client.guilds.cache.size, inline: true},
                    {name: 'Canais de voz', value: message.client.voice.connections.size, inline: true},
                    {name: 'Uptime', value: `${((Date.now() - startupTime) / 1000).toFixed(0)} s`, inline: true},
                    {name: 'UID', value: message.client.user.id, inline: false},
                    {name: 'Servidor', value: message.guild.region, inline: true},
                    {name: 'Ping', value: `${message.client.ws.ping.toFixed(0)} ms`, inline: true},
                ]));
        }
    },

    restart: {
        description: 'Reinicia o bot.',
        only: [adminID],

        /**
         *
         * @return {Promise<*>}
         */
        fn: async () => {
            process.exit(0);
        },
    },

    reload: {
        description: 'Recarrega os comandos do bot.',
        only: [adminID],

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<void>}
         */
        fn: async (message, args) => {
            delete require.cache[require.resolve('./')];
            message.client.loadCommands(require('./'));
            return await message.channel.send('Jukera tá de volta.');
        },
    }
}
