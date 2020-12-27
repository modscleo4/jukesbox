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

import {ytapikey} from "../../config.js";
import {searchVideo} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import play from "./play.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Searches for a music/playlist. Use `/playlist` to search for playlists.',
        pt_BR: 'Procura por uma música/playlist. Use `/playlist` para procurar por playlists.',
    },
    usage: 'search [/playlist] [q]',

    botPermissions: {
        voice: ['CONNECT', 'SPEAK'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        await this.checkVoiceChannel(message);

        await this.checkPermissions(message);

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
            return await message.channel.send(i18n('music.search.noArgs', sc?.lang));
        }

        const results = await searchVideo(args.join(' '), {
            key: ytapikey,
            regionCode: 'us',
            type: kind,
            videoEmbeddable: kind === 'video' ? true : 'any',
        });

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, results.length);

        const msg = await message.channel.send(new MessageEmbed({
            title: i18n('music.search.embedTitle', sc?.lang),
            author: {name: message.author.username, iconURL: message.author.avatarURL()},
            timestamp: new Date(),
            description: results.map((r, i) => `**${i + 1}** - [${r.snippet.title}](${r.url}) | ${r.snippet.channelTitle}`).join('\n\n'),
        }));

        reactions.map(async r => await msg.react(r).catch(() => {

        }));

        await msg.awaitReactions((r, u) => reactions.includes(r.emoji.name) && u.id === message.author.id, {
            max: 1,
            time: 60000,
            errors: ['time'],
        }).then(async collected => {
            const reaction = collected.first();
            await play.fn(message, [results[reactions.indexOf(reaction.emoji.name)].url]);
        }).catch(() => {

        });

        if (!msg.deleted) {
            return await msg.delete().catch(() => {

            });
        }
    },
});
