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
 * @file Chat plugin (clear command)
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
        en_US: 'Deletes `n` messages from the current channel.',
        pt_BR: 'Apaga `n` mensagens do canal atual.',
    },
    options: [
        {
            name: 'n',
            description: 'Number of messages to delete.',
            type: OptionType.INTEGER,
            required: true,
        }
    ],

    botPermissions: {
        text: ['MANAGE_MESSAGES'],
    },

    userPermissions: {
        text: ['MANAGE_MESSAGES'],
    },

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
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({guild, channel, author, member});

        if (!args[0]) {
            return {content: i18n('chat.clear.noArgs', sc?.lang)};
        }

        if (args[-1]) {
            await channel.bulkDelete(1);
        }

        const n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;

        await (async () => {
            n % 100 > 0 && await channel.bulkDelete(n % 100);

            for (let i = 0; i < Math.floor(n / 100); i++) {
                await channel.bulkDelete(100).catch(e => {

                });
            }
        })().catch(e => {

        });

        return {content: i18n('chat.clear.deletedN', sc?.lang, {n})};
    }
});
