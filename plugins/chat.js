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
            let n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;

            await message.delete().then(async () => {
                for (let i = 0; i < n; i += 100) {
                    await message.channel.bulkDelete(n);
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
