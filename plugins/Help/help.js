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
 * @file Help plugin (help command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {serverConfig} from "../../global.js";
import {prefix} from "../../config.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Show the commands.',
        pt_BR: 'Mostra os comandos.',
    },
    options: [
        {
            name: 'cmd_1',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_2',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_3',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_4',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_5',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_6',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_7',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_8',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_9',
            description: 'Command Name',
            type: OptionType.STRING,
        },
        {
            name: 'cmd_10',
            description: 'Command Name',
            type: OptionType.STRING,
        }
    ],

    botPermissions: {
        text: ['EMBED_LINKS'],
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
        const serverPrefix = sc?.prefix ?? prefix;

        await this.checkPermissions({guild, channel, author, member});

        const description = i18n('help.help.longDescription', sc?.lang, {serverPrefix});

        const commands = client.commands;
        const aliases = client.aliases;

        if (args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                if (!(args[i] in commands) && !(args[i] in aliases) || ((commands[args[i]] ?? commands[aliases[args[i]]]).only && !(commands[args[i]] ?? commands[aliases[args[i]]]).only.includes(author.id))) {
                    return i18n('help.help.commandNotFound', sc?.lang, {command: args[i]});
                }
            }

            let desc = i18n('help.help.shortDescription', sc?.lang, {serverPrefix});
            for (let i = 0; i < args.length; i++) {
                const command = commands[args[i]] ?? commands[aliases[args[i]]];

                desc += i18n('help.help.detailedHelp', sc?.lang, {serverPrefix, command, sc, cmd: args[i] in aliases ? aliases[args[i]] : args[i]});

                command.aliases.length > 0 && (desc += i18n('help.help.alias', sc?.lang, {aliases: command.aliases.map(a => `\`${a}\``).join(', ')}));
                command.botPermissions && (desc += i18n('help.help.botPermissions', sc?.lang, {botPermissions: [...(command.botPermissions.server ?? []), ...(command.botPermissions.text ?? []), ...(command.botPermissions.voice ?? [])].map(p => `\`${p}\``).join(', ')}));
                command.userPermissions && (desc += i18n('help.help.userPermissions', sc?.lang, {userPermissions: [...(command.userPermissions.server ?? []), ...(command.userPermissions.text ?? []), ...(command.userPermissions.voice ?? [])].map(p => `\`${p}\``).join(', ')}));
            }

            return new MessageEmbed({
                title: i18n('help.help.embedTitle', sc?.lang),
                description: desc,
                author: {name: client.user.username, iconURL: client.user.avatarURL()},
                timestamp: new Date(),
            });
        }

        const cmds = [];
        Object.keys(client.categoriesCommands).forEach((cat, i, arr) => {
            const category = {...client.categoriesCommands[cat]};
            const c = {name: cat, value: '', inline: false};

            for (const cmd in category) {
                const command = category[cmd];

                if (command.only && !command.only.includes(author.id)) {
                    continue;
                }

                c.value += i18n('help.help.shortHelp', sc?.lang, {serverPrefix, cmd, command, sc, aliases: command.aliases.map(a => `,,,${a},,,`).join(', ')}) + '\n';
            }

            if (c.value.length > 0) {
                cmds.push(c);

                if (i < arr.length - 1) {
                    cmds.push({name: '\u200B', value: '\u200B'});
                }
            }
        });

        return new MessageEmbed({
            title: i18n('help.help.embedTitle', sc?.lang),
            description,
            author: {name: client.user.username, iconURL: client.user.avatarURL()},
            timestamp: new Date(),
            fields: cmds,
        });
    }
});
