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
 * @file Music plugin (nowplaying command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {queue} from "../../global.js";
import {getGeniusLyrics} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {geniusToken} from '../../config.js';
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows the current song lyrics.',
        pt_BR: 'Mostra a letra da música que está tocando.',
    },

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {String[]} args
     * @return {Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member}, args) {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        await this.checkPermissions({guild, channel, author, member});

        let q;
        if (!args.length) {
            if (!serverQueue) {
                return i18n('music.queueEmpty', sc?.lang);
            }

            q = `${serverQueue.song.uploader} - ${serverQueue.song.title}`;
        } else {
            q = args.join(' ');
        }

        const lyrics = await getGeniusLyrics(geniusToken, q);
        if (!lyrics) {
            return i18n('music.lyrics.nothingFound', sc?.lang);
        }

        return lyrics;
    },
});
