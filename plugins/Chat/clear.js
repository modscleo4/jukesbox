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

import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

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
        },
        {
            name: 'delete_pinned',
            description: 'Delete pinned messages.',
            type: OptionType.BOOLEAN,
            required: false,
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
            throw new CommandExecutionError({content: i18n('chat.clear.noArgs', sc?.lang)});
        }

        if (args[-1]) {
            await channel.bulkDelete([args[-1]]);
        }

        if (typeof args[1] === 'string') {
            args[1] = args[1].toLowerCase() === 'true';
        }

        const before_14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;

        // split n in chunks of 100 and remainder
        const chunks = [];
        let i;
        for (i = 0; (i + 100) <= n; i += 100) {
            chunks.push(100);
        }

        if (i < n) {
            chunks.push(n - i);
        }

        for (const v of chunks) {
            const messages = (await channel.messages.fetch({limit: v})).filter(/** @param {Message} m */ m => m.createdAt >= before_14 && (args[1] || !m.pinned)).map(m => m);
            await channel.bulkDelete(messages).catch(() => { });
        }

        return {content: i18n('chat.clear.deletedN', sc?.lang, {n}), deleteAfter: 1};
    }
});
