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
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Displays the current queue.',
        pt_BR: 'Mostra a fila.',
    },

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

        const songs = serverQueue.songs.map((s, i) => {
            return {name: `${i + 1}: [${s.title}](${s.url})`, value: s.uploader};
        });

        return await pageEmbed({client, author}, {title: i18n('music.queue.embedTitle', sc?.lang), content: songs});
    },
});
