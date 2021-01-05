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
 * @file Moderation plugin (rmrole command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Remove one or more roles from a `@member`.',
        pt_BR: 'Remove um ou mais cargos de um `@membro`.',
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
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        await this.checkPermissions(message);

        if (!args[0]?.match(/\d+/gm)) {
            return await message.channel.send(i18n('mod.rmrole.missingUser', sc?.lang));
        }

        if (args.length < 2) {
            return await message.channel.send(i18n('mod.rmrole.missingRole', sc?.lang));
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const guildMember = message.guild.member(userID);
        const roles = args.map(r => message.guild.roles.cache.find(g => g.name === r));

        if (!guildMember) {
            return await message.channel.send(i18n('mod.rmrole.invalidUser', sc?.lang));
        }

        if (roles.includes(undefined)) {
            return await message.channel.send(i18n('mod.rmrole.invalidRole', sc?.lang, {role: args[roles.indexOf(undefined)]}));
        }

        if (roles.find(r => !r.editable)) {
            return message.channel.send(i18n('mod.rmrole.nonEditableRole', sc?.lang, {role: roles.find(r => !r.editable).name}));
        }

        await guildMember.roles.remove(roles);
        await message.channel.send(i18n('mod.rmrole.success', sc?.lang, {user: guildMember.user.id}));
    },
});
