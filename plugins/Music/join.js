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
 * @file Music plugin (join command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message, MessageEmbed} from "discord.js";

import Command from "../../lib/Command.js";
import getLocalizedString from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Joins the current Voice Channel.',
        pt_BR: 'Entra no canal de voz.',
    },
    usage: 'join',

    botPermissions: {
        voice: ['CONNECT', 'SPEAK'],
    },

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    async fn(message) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return await message.channel.send(`Tá solo né filha da puta.`);
        }

        await this.checkPermissions(message);

        await voiceChannel.join();
        return await message.channel.send(new MessageEmbed({
            title: 'Salve salve Yodinha!',
            author: {name: message.author.username, iconURL: message.author.avatarURL()},
            timestamp: new Date(),
            description: 'Conectado a um canal de voz',
            fields: [
                {name: 'Canal de voz', value: voiceChannel.name, inline: true},
                {name: 'Canal de texto', value: message.channel.name, inline: true}
            ],
        }));
    },
});
