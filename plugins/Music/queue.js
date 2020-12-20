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
 * @file Music plugin (queue command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import {queue} from "../../global.js";
import {pageEmbed} from "../../lib/utils.js";
import Command from "../../lib/Command.js";
import getLocalizedString from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Displays the current queue.',
        pt_BR: 'Mostra a fila.',
    },
    usage: 'queue',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    async fn(message) {
        const serverQueue = queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        const songs = serverQueue.songs.map((s, i) => {
            return {name: `${i + 1}: [${s.title}](${s.url})`, value: s.uploader}
        });

        return await pageEmbed(message, {title: 'Fila tá assim lek', content: songs});
    },
});
