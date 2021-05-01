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
import {parseMS} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows the current song.',
        pt_BR: 'Mostra a música que está tocando.',
    },

    aliases: ['np'],

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @return {Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member}) {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        await this.checkPermissions({guild, channel, author, member});

        if (!serverQueue) {
            return i18n('music.queueEmpty', sc?.lang);
        }

        return new MessageEmbed({
            title: i18n('music.nowplaying.embedTitle', sc?.lang),
            url: serverQueue.song.url,
            author: {name: serverQueue.song.addedBy.username, iconURL: serverQueue.song.addedBy.avatarURL()},
            color: {yt: 'RED', sc: 'ORANGE', sp: 'GREEN'}[serverQueue.song.from],
            timestamp: new Date(),
            thumbnail: {url: serverQueue.song.thumbnail},
            description: serverQueue.song.title,
            fields: [
                {name: i18n('music.nowplaying.channel', sc?.lang), value: serverQueue.song.uploader},
                {name: i18n('music.nowplaying.queuePos', sc?.lang), value: serverQueue.position + 1, inline: true},
                {name: i18n('music.nowplaying.duration', sc?.lang), value: `${parseMS(serverQueue.player.streamTime + serverQueue.startTime * 1000)} / ${parseMS(serverQueue.song.duration * 1000)}`, inline: true},
            ],
        });
    },
});
