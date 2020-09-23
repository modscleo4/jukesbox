module.exports = {
    clear: {
        description: 'Apaga {n} mensagens do canal atual.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @param {Client} client
         */
        fn: async (message, args, client) => {
            if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) {
                return await message.channel.send('ME AJUDA.');
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
    }
}
