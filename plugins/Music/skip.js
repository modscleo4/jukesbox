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
 * @file Music plugin (skip command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {queue} from "../../global.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Skip `n` songs.',
        pt_BR: 'Pula `n` músicas.',
    },
    options: [
        {
            name: 'n',
            description: 'Number of songs to skip.',
            type: OptionType.INTEGER,
        }
    ],

    aliases: ['next'],

    /**
     *
     * @this {Command}
     * @param {Object} message
     * @param {import('../../lib/Client.js').default} message.client
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').TextChannel} message.channel
     * @param {import('discord.js').User} message.author
     * @param {import('discord.js').GuildMember} message.member
     * @param {Function} message.sendMessage
     * @param {string[]} args
     * @return {Promise<{content?: string, embeds?: import('discord.js').MessageEmbed[], lockAuthor?: boolean, reactions?: string[], onReact?: Function, onEndReact?: Function, timer?: number, deleteAfter?: boolean}>}{Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        await this.checkVoiceChannel({guild, member});

        if (!serverQueue) {
            return {content: i18n('music.queueEmpty', sc?.lang)};
        }

        const skips = Math.min((args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1, serverQueue.songs.length);
        if (skips === serverQueue.songs.length) {
            serverQueue.playing = false;
        }

        serverQueue.songs.splice(serverQueue.position, skips - 1);
        if (serverQueue.loop) {
            serverQueue.songs.shift();
        }

        !serverQueue.playing && serverQueue.connection?.dispatcher?.resume();
        serverQueue.connection?.dispatcher?.end();

        return {content: i18n('music.skip.success', sc?.lang)};
    },
});
