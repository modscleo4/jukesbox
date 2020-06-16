module.exports = {
    clearchannel: {
        description: 'Limpa o chat atual.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @param {Client} client
         */
        fn: async (message, args, client) => {
            let n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;
            if (n > 100) {
                n = 100;
            }

            await message.channel.bulkDelete(await message.channel.messages.fetch({limit: n}));
            await message.channel.send(`Apaguei ${n} mensagens.`).then(m => m.delete({timeout: 1000}));
        }
    }
}
