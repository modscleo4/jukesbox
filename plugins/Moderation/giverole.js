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

import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Give one or more roles to a `@member`.',
        pt_BR: 'Adiciona um ou mais cargos a um `@membro`.',
    },
    options: [
        {
            name: 'user',
            description: 'Target User',
            type: OptionType.USER,
            required: true,
        },
        {
            name: 'role_1',
            description: 'Target Role',
            type: OptionType.ROLE,
            required: true,
        },
        {
            name: 'role_2',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_3',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_4',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_5',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_6',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_7',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_8',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_9',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
        {
            name: 'role_10',
            description: 'Target Role',
            type: OptionType.ROLE,
        },
    ],

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
     * @return {Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member}, args) {
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({guild, channel, author, member});

        if (!args[0]?.match(/\d+/gm)) {
            return i18n('mod.giverole.missingUser', sc?.lang);
        }

        if (args.length < 2) {
            return i18n('mod.giverole.missingRole', sc?.lang);
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const guildMember = await guild.members.fetch(userID);
        const roles = args.map(r => guild.roles.cache.find(g => g.name === r || g.id === r));

        if (!guildMember) {
            return i18n('mod.giverole.invalidUser', sc?.lang);
        }

        if (roles.includes(undefined)) {
            return i18n('mod.giverole.invalidRole', sc?.lang, {role: args[roles.indexOf(undefined)]});
        }

        if (roles.find(r => !r.editable)) {
            return i18n('mod.giverole.nonEditableRole', sc?.lang, {role: roles.find(r => !r.editable).name});
        }

        await guildMember.roles.add(roles);
        return i18n('mod.giverole.success', sc?.lang, {user: guildMember.user.id});
    },
});
