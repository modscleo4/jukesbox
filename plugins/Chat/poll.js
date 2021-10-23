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
 * @file Chat plugin (poll command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import MessageEmbed from "../../lib/MessageEmbed.js";

import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

export default new Command({
    description: {
        en_US: 'Create a poll (max. of 10 items). They must be between `""`.',
        pt_BR: 'Cria uma enquete (máx. de 10 itens). Os itens devem estar entre `""`',
    },
    options: [
        {
            name: 'title',
            description: 'Poll Title',
            type: OptionType.STRING,
            required: true,
        },
        {
            name: 'timer',
            description: 'Poll Timer (minutes)',
            type: OptionType.INTEGER,
            required: true,
        },
        {
            name: 'option_1',
            description: 'Option 1',
            type: OptionType.STRING,
            required: true,
        },
        {
            name: 'option_2',
            description: 'Option 2',
            type: OptionType.STRING,
            required: true,
        },
        {
            name: 'option_3',
            description: 'Option 3',
            type: OptionType.STRING,
        },
        {
            name: 'option_4',
            description: 'Option 4',
            type: OptionType.STRING,
        },
        {
            name: 'option_5',
            description: 'Option 5',
            type: OptionType.STRING,
        },
        {
            name: 'option_6',
            description: 'Option 6',
            type: OptionType.STRING,
        },
        {
            name: 'option_7',
            description: 'Option 7',
            type: OptionType.STRING,
        },
        {
            name: 'option_8',
            description: 'Option 8',
            type: OptionType.STRING,
        },
        {
            name: 'option_9',
            description: 'Option 9',
            type: OptionType.STRING,
        },
        {
            name: 'option_10',
            description: 'Option 10',
            type: OptionType.STRING,
        },
    ],

    deleteUserMessage: true,

    botPermissions: {
        text: ['EMBED_LINKS'],
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

        if (args.length < 1) {
            throw new CommandExecutionError({content: i18n('chat.poll.missingTitle', sc?.lang)});
        }

        if (args.length < 2) {
            throw new CommandExecutionError({content: i18n('chat.poll.missingTimer', sc?.lang)});
        }

        if (isNaN(parseInt(args[1])) || parseInt(args[1]) < 0 || parseInt(args[1]) > 15) {
            throw new CommandExecutionError({content: i18n('chat.poll.invalidTimer', sc?.lang)});
        }

        if (args.length < 4) {
            throw new CommandExecutionError({content: i18n('chat.poll.missingOptions', sc?.lang)});
        }

        const title = args.splice(0, 1)[0];
        const timer = parseInt(args.splice(0, 1)[0]);
        args = args.map(a => a.replace(/"/gmi, ''));

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, args.length);

        const results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].splice(0, args.length);

        return {
            embeds: [new MessageEmbed({
                title,
                author: {name: client.user.username, icon_url: client.user.avatarURL()},
                timestamp: new Date().toUTCString(),
                description: args.map((r, i) => `**${i + 1}** - ${r}`).join('\n\n'),
            })],
            reactions,
            timer,
            onReact: async ({reaction, user, message, add}) => {
                results[reactions.indexOf(reaction.emoji.name)] += add ? 1 : -1;
            },
            onEndReact: async ({message}) => {
                await channel.send(i18n('chat.poll.results', sc?.lang, {results: results.map((v, i) => ({key: args[i], val: v})).sort((a, b) => b.val - a.val)}));
            },
        };
    },
});
