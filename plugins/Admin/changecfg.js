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
 * @file Admin plugin (changecfg command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import * as config from "../../config.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import * as global from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

export default new Command({
    description: {
        en_US: 'Change .env config at runtime.',
        pt_BR: 'Altera configurações do .env em runtime.',
    },
    options: [
        {
            name: 'cfg',
            description: 'Config name.',
            type: OptionType.STRING,
            required: true,
            choices: configOptions,
        },
        {
            name: 'val',
            description: 'JavaScript code.',
            type: OptionType.STRING,
            required: true,
        }
    ],

    only: [config.options.adminID],

    /**
     *
     * @this {Command}
     * @param {Object} message
     * @param {import('../../lib/Client.js').default} message.client
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').TextChannel} message.channel
     * @param {import('discord.js').User} message.author
     * @param {import('discord.js').GuildMember} message.member
     * @param {import('../../lib/Command.js').SendMessageFn} message.sendMessage
     * @param {string[]} args
     * @return {Promise<import('../../lib/Command.js').CommandReturn>}
     */
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = global.serverConfig.get(guild.id);

        if (args.length === 0) {
            throw new CommandExecutionError({content: i18n('admin.changecfg.noArgs', sc?.lang)});
        }

        const cfg = config.configOptions.find(c => c.value === args[0]);
        if (!cfg) {
            throw new CommandExecutionError({content: i18n('admin.changecfg.invalidCfg', sc?.lang)});
        }

        if (args.length < 2) {
            throw new CommandExecutionError({content: i18n('admin.changecfg.noVal', sc?.lang)});
        }

        process.env[cfg.envName] = args[1];

        config.reloadConfig();

        return {content: i18n('admin.changecfg.success', sc?.lang)};
    },
});
