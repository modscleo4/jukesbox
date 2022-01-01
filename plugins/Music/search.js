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
 * @file Music plugin (search command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {ytapikeys} from "../../config.js";
import {searchVideo} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import play from "./play.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Searches for a music/playlist. Use `/playlist` to search for playlists.',
        pt_BR: 'Procura por uma música/playlist. Use `/playlist` para procurar por playlists.',
    },
    options: [
        {
            name: 'mode',
            description: 'Query Search Mode',
            type: OptionType.STRING,
            choices: [
                {
                    name: 'Video Search Mode',
                    value: '/video',
                },
                {
                    name: 'Playlist Search Mode',
                    value: '/playlist',
                },
            ],
            required: true,
        },
        {
            name: 'q',
            description: 'Query String',
            type: OptionType.STRING,
            required: true,
        }
    ],

    botPermissions: {
        text: ['EMBED_LINKS'],
        voice: ['CONNECT', 'SPEAK'],
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

        await this.checkVoiceChannel({guild, member});

        await this.checkPermissions({guild, channel, author, member});

        /**
         * @type {'video'|'playlist'}
         */
        let kind = 'video';
        switch (args[0]) {
            case '/playlist':
                args.shift();
                kind = 'playlist';
                break;

            case '/video':
                args.shift();
                kind = 'video';
                break;

            default:
                break;
        }

        if (!args[0]) {
            return {content: i18n('music.search.noArgs', sc?.lang)};
        }

        const results = await searchVideo(args.join(' '), {
            keys: ytapikeys,
            regionCode: 'us',
            type: kind,
            videoEmbeddable: kind === 'video' ? true : 'any',
        });

        if (results.length === 0) {
            return {content: i18n('music.search.nothingFound', sc?.lang)};
        }

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, results.length);

        const msg = new MessageEmbed({
            title: i18n('music.search.embedTitle', sc?.lang),
            author: {name: author.username, iconURL: author.avatarURL()},
            timestamp: new Date(),
            description: results.map((r, i) => `**${i + 1}** - [${r.snippet.title}](${r.url}) | ${r.snippet.channelTitle}`).join('\n\n'),
        });

        return {
            embeds: [msg],
            reactions,
            timer: 1,
            lockAuthor: true,
            onReact: async ({reaction, stop}) => {
                stop();
                sendMessage(await play.fn({client, guild, channel, author, member, sendMessage}, [results[reactions.indexOf(reaction.emoji.name)].url]));
            },
            deleteAfter: true,
        };
    },
});
