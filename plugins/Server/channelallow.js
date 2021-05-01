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
 * @file Server configuration plugin (channelallow command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Allows one or more command on the current Text Channel.',
        pt_BR: 'Permite um ou mais comandos no Canal de Texto atual.',
    },
    options: [
        {
            name: 'cmd',
            description: 'Command Name',
            type: OptionType.STRING,
            required: true,
        }
    ],

    userPermissions: {
        text: ['MANAGE_CHANNELS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member}, args) {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({guild: guild.id, prefix});

        if (args.length === 0) {
            return i18n('server.channelallow.noArgs', sc?.lang);
        }

        await this.checkPermissions({guild, channel, author, member});

        const categoriesCommands = client.categoriesCommands;
        const commands = client.commands;

        for (let i = 0; i < args.length; i++) {
            if (args[i].match(/category\/\w+/gmiu)) {
                const {category} = /category\/(?<category>\w+)/gmiu.exec(args[i]).groups;

                if (!(category in categoriesCommands)) {
                    return i18n('server.channeldeny.categoryNotFound', sc?.lang, {category});
                }

                args.splice(i, 1, ...Object.keys(categoriesCommands[category]));
            } else if (!(args[i] in commands) || (commands[args[i]].only && !commands[args[i]].only.includes(author.id))) {
                return i18n('server.channeldeny.commandNotFound', sc?.lang, {command: args[i]});
            }
        }

        sc.allowCommands({channel}, args);
        serverConfig.set(guild.id, sc);
        await sc.save(database_url);

        return i18n('server.channelallow.success', sc?.lang, {n: args.length});
    },
});
