const Discord = require('discord.js');
const {prefix} = require('../config.js');

module.exports = {
    help: {
        description: 'Mostra os comandos.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @param {Discord.Client} client
         * @return {Promise<void>}
         */
        fn: async (message, args, client) => {
            const commands = require('./');
            const cmds = [];
            for (const c in commands) {
                if (commands[c].only && !commands[c].only.includes(message.author.id)) {
                    continue;
                }

                cmds[cmds.length] = {name: `${prefix}${c}`, value: commands[c].description};
            }

            const maxPerPage = 10;
            const pages = Math.ceil(cmds.length / maxPerPage);
            let page = 1;

            const msg = await message.channel.send(new Discord.MessageEmbed()
                .setTitle('Eu entendo isso aqui vei')
                .setAuthor(client.user.username, client.user.avatarURL())
                .setTimestamp()
                .addFields(cmds)
                .spliceFields(0, (page - 1) * maxPerPage)
                .spliceFields(maxPerPage, cmds.length - page * maxPerPage)
                .setFooter(`Página ${page} de ${pages}`));

            async function awaitReactions(msg) {
                const reactions = [];
                if (pages > 1) {
                    if (page > 1) {
                        reactions.push('⬅️');
                    }

                    if (page < pages) {
                        reactions.push('➡️');
                    }
                }

                reactions.map(r => msg.react(r));

                await msg.awaitReactions((r, u) => reactions.includes(r.emoji.name) && u.id === message.author.id, {
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                }).then(async collected => {
                    const reaction = collected.first();
                    page += reaction.emoji.name === '⬅️' ? -1 : 1;

                    await msg.reactions.removeAll();

                    await new Promise(r => setTimeout(r, 100));
                    await msg.edit(new Discord.MessageEmbed()
                        .setTitle('Eu entendo isso aqui vei')
                        .setAuthor(client.user.username, client.user.avatarURL())
                        .setTimestamp()
                        .addFields(cmds)
                        .spliceFields(0, (page - 1) * maxPerPage)
                        .spliceFields(maxPerPage, cmds.length - page * maxPerPage)
                        .setFooter(`Página ${page} de ${pages}`));

                    await awaitReactions(msg);
                }).catch(() => {

                });
            }

            await awaitReactions(msg);

            if (!msg.deleted) {
                await msg.delete();
            }
        }
    }
}
