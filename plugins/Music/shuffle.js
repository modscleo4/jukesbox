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
 * @file Music plugin (shuffle command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {queue} from "../../global.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Toggles the Shuffle mode.',
        pt_BR: 'Liga/desliga o modo Aleatório.',
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

        if (!serverQueue) {
            return i18n('music.queueEmpty', sc?.lang);
        }

        serverQueue.shuffle = !serverQueue.shuffle;

        if (serverQueue.shuffle) {
            return i18n('music.shuffle.successOn', sc?.lang);
        } else {
            return i18n('music.shuffle.successOff', sc?.lang);
        }
    },
});
