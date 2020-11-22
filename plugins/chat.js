const {Message, MessageEmbed} = require('discord.js');

module.exports = {
    clear: {
        description: 'Apaga {n} mensagens do canal atual.',
        usage: 'clear [n]...',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         */
        fn: async (message, args) => {
            if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) {
                return await message.channel.send('ME AJUDA.');
            }

            if (!message.member.guild.member(message.author).hasPermission('MANAGE_MESSAGES')) {
                return await message.channel.send('Coé rapaz tá doidão?');
            }

            const n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;

            await message.delete().then(async () => {
                n % 100 > 0 && await message.channel.bulkDelete(n % 100);

                for (let i = 0; i < Math.floor(n / 100); i++) {
                    await message.channel.bulkDelete(100);
                }
            }).then(async () => {
                await message.channel.send(`Apaguei ${n} mensagens.`).then(m => m.delete({timeout: 1000}));
            }).catch(async e => {
                console.error(e);
                await message.channel.send('Deu ruim aqui lek.');
            });
        }
    },

    poll: {
        description: 'Cria uma enquete (máx. de 10 itens). Os itens devem estar entre ""',
        usage: 'poll [n1] [n2] ... n[10]',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const titleI = args.findIndex(a => /\/title{[^}]+}/gmi.test(a));
            if (titleI === -1) {
                return await message.channel.send('Informe o título da enquete.');
            }

            const title = /\/title{(?<Title>[^}]+)}/gmi.exec(args[titleI]).groups.Title;
            args.splice(titleI, 1);
            args = args.map(a => a.replace(/"/gmi, ''));

            const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, args.length);

            const msg = await message.channel.send(new MessageEmbed()
                .setTitle(title)
                .setAuthor(message.client.user.username, message.client.user.avatarURL())
                .setTimestamp()
                .setDescription(args.map((r, i) => `**${i + 1}** - ${r}`).join('\n\n')));

            await message.delete();
            reactions.map(async r => await msg.react(r));
        },
    },
}
