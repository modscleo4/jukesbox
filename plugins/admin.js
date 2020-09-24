const {adminID, startupTime} = require('../config');
const {Client, MessageEmbed} = require('discord.js');

module.exports = {
    botinfo: {
        description: 'Informações do bot.',
        only: [adminID],

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @param {Client} client
         * @return {Promise<*>}
         */
        fn: async (message, args, client) => {

            return await message.channel.send(new MessageEmbed()
                .setTitle('Admin')
                .setAuthor(client.user.username, client.user.avatarURL())
                .setTimestamp()
                .addFields([
                    {name: 'Servidores', value: client.guilds.cache.size, inline: true},
                    {name: 'Canais de voz', value: client.voice.broadcasts.length, inline: true},
                    {name: 'Uptime', value: `${((Date.now() - startupTime) / 1000).toFixed(0)} s`, inline: true},
                    {name: 'UID', value: client.user.id, inline: false},
                    {name: 'Servidor', value: message.guild.region, inline: true},
                    {name: 'Ping', value: `${client.ws.ping.toFixed(0)} ms`, inline: true},
                ]));
        }
    },

    restart: {
        description: 'Reinicia o bot.',
        only: [adminID],

        fn: async () => {
            process.exit(0);
        },
    }
}
