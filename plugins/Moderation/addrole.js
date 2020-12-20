/**
 * Copyright 2020 Dhiego Cassiano Fogaça Barbosa

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @file Moderation plugin (addrole command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message} from "discord.js";

import Command from "../../lib/Command.js";
import getLocalizedString from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Give one or more roles to a `@member`.',
        pt_BR: 'Adiciona um ou mais cargos a um `@membro`.',
    },
    usage: 'addrole [@member] [role1] [role2]...',

    botPermissions: {
        server: ['MANAGE_ROLES'],
    },

    userPermissions: {
        server: ['MANAGE_ROLES'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        await this.checkPermissions(message);

        if (!args[0].match(/\d+/gm)) {
            return await message.channel.send('Informe o @membro.');
        }

        if (args.length < 2) {
            return await message.channel.send('Informe um cargo.');
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const guildMember = message.guild.member(userID);
        const roles = args.map(r => message.guild.roles.cache.find(g => g.name === r));

        if (!guildMember) {
            return await message.channel.send('Usuário inválido.');
        }

        if (roles.includes(undefined)) {
            return await message.channel.send(`Cargo \`${args[roles.indexOf(undefined)]}\` não encontrado.`);
        }

        if (roles.find(r => !r.editable)) {
            return message.channel.send(`A Role \`${roles.find(r => !r.editable).name}\` é muito potente.`);
        }

        await guildMember.roles.add(roles);
        await message.channel.send('Cargos adicionados.');
    },
});
