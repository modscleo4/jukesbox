module.exports = {
    help: {
        description: 'Mostra os comandos.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<void>}
         */
        fn: async (message, args) => {
            const commands = require('./');

            let msg = 'Eu entendo isso aqui vei:\n\n';
            for (let c in commands) {
                msg += `\`${c}\`: ${commands[c].description}\n`;
            }

            await message.channel.send(msg);
        }
    }
}
