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
import getLocalizedString from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows the current song.',
        pt_BR: 'Mostra a música que está tocando.',
    },
    usage: 'nowplaying',

    alias: ['np'],

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    async fn(message) {
        const serverQueue = queue.get(message.guild.id);

        if (!serverQueue) {
            await message.channel.send('Tá limpo vei.');
            return null;
        }

        return await message.channel.send(new MessageEmbed({
            title: 'Que porra de música é essa que tá tocando caraio!',
            url: serverQueue.song.url,
            author: {name: serverQueue.song.addedBy.username, iconURL: serverQueue.song.addedBy.avatarURL()},
            color: {yt: 'RED', sc: 'ORANGE', sp: 'GREEN'}[serverQueue.song.from],
            timestamp: new Date(),
            thumbnail: {url: serverQueue.song.thumbnail},
            description: serverQueue.song.title,
            fields: [
                {name: 'Canal', value: serverQueue.song.uploader},
                {name: 'Posição na fila', value: serverQueue.position + 1, inline: true},
                {name: 'Duração', value: parseMS(serverQueue.song.duration * 1000), inline: true},
            ],
        }));
    },
});
