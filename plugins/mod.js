module.exports = {
    addrole: {
        description: 'Adiciona um ou mais cargos a um @membro.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const permissions = message.channel.permissionsFor(message.client.user);
            if (!permissions.has('MANAGE_ROLES')) {
                return await message.channel.send('ME AJUDA!');
            }

            if (!args[0].match(/\d+/gm)) {
                return await message.channel.send('Informe o @membro.');
            }

            if (args.length < 2) {
                return await message.channel.send('Informe um cargo.');
            }

            const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
            const user = message.guild.member(userID);
            const roles = args.map(r => message.guild.roles.cache.find(g => g.name === r));

            if (!user) {
                return await message.channel.send('Usuário inválido.');
            }

            if (roles.includes(undefined)) {
                return await message.channel.send(`Cargo \`${args[roles.indexOf(undefined)]}\` não encontrado.`);
            }

            if (roles.find(r => !r.editable)) {
                return message.channel.send(`A Role \`${roles.find(r => !r.editable)}\` é muito potente.`);
            }

            await user.roles.add(roles);
            await message.channel.send('Cargos adicionados.');
        },
    },

    rmrole: {
        description: 'Remove um ou mais cargos de um @membro.',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<*>}
         */
        fn: async (message, args) => {
            const permissions = message.channel.permissionsFor(message.client.user);
            if (!permissions.has('MANAGE_ROLES')) {
                return await message.channel.send('ME AJUDA!');
            }

            if (!args[0].match(/\d+/gm)) {
                return await message.channel.send('Informe o @membro.');
            }

            if (args.length < 2) {
                return await message.channel.send('Informe um cargo.');
            }

            const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
            const user = message.guild.member(userID);
            const roles = args.map(r => message.guild.roles.cache.find(g => g.name === r));

            if (!user) {
                return await message.channel.send('Usuário inválido.');
            }

            if (roles.includes(undefined)) {
                return await message.channel.send(`Cargo \`${args[roles.indexOf(undefined)]}\` não encontrado.`);
            }

            if (roles.find(r => !r.editable)) {
                return message.channel.send(`A Role \`${roles.find(r => !r.editable)}\` é muito potente.`);
            }

            await user.roles.remove(roles);
            await message.channel.send('Cargos removidos.');
        },
    },
}
