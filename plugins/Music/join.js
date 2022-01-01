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

import {MessageEmbed} from "discord.js";

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Joins the current Voice Channel.',
        pt_BR: 'Entra no canal de voz.',
    },

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

        const voiceConnection = await member.voice.channel.join();
        await voiceConnection.voice?.setSelfDeaf(true);

        return {
            embeds: [new MessageEmbed({
                title: i18n('music.join.embedTitle', sc?.lang),
                author: {name: author.username, iconURL: author.avatarURL()},
                timestamp: new Date(),
                description: i18n('music.join.embedDescription', sc?.lang),
                fields: [
                    {name: i18n('music.join.voiceChannel', sc?.lang), value: member.voice.channel.name, inline: true},
                    {name: i18n('music.join.textChannel', sc?.lang), value: channel.name, inline: true}
                ],
            })]
        };
    },
});
