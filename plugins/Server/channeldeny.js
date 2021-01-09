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
 * @file Server configuration plugin (channeldeny command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Denies one or more command on the current Text Channel.',
        pt_BR: 'Bloqueia um ou mais comandos no Canal de Texto atual.',
    },
    usage: 'channeldeny [command1] [command2]',

    userPermissions: {
        text: ['MANAGE_CHANNELS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix});

        if (args.length === 0) {
            return await message.channel.send(i18n('server.channeldeny.noArgs', sc?.lang));
        }

        await this.checkPermissions(message);

        if (args.includes('channelallow')) {
            return await message.channel.send(i18n('server.channeldeny.cannotBlock', sc?.lang));
        }

        const categoriesCommands = message.client.categoriesCommands;
        const commands = message.client.commands;

        for (let i = 0; i < args.length; i++) {
            if (args[i].match(/category\/\w+/gmiu)) {
                const {category} = /category\/(?<category>\w+)/gmiu.exec(args[i]).groups;

                if (!(category in categoriesCommands)) {
                    return await message.channel.send(i18n('server.channeldeny.categoryNotFound', sc?.lang, {category}));
                }

                args.splice(i, 1, ...Object.keys(categoriesCommands[category]).filter(c => c !== 'channelallow'));
            } else if (!(args[i] in commands) || (commands[args[i]].only && !commands[args[i]].only.includes(message.author.id))) {
                return await message.channel.send(i18n('server.channeldeny.commandNotFound', sc?.lang, {command: args[i]}));
            }
        }

        sc.denyCommands(message, args);
        serverConfig.set(message.guild.id, sc);
        await sc.save(database_url);

        return await message.channel.send(i18n('server.channeldeny.success', sc?.lang, {n: args.length}));
    },
});
