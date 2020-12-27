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
 * @file Moderation plugin (userinfo command)
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
        en_US: '`@member` information.',
        pt_BR: 'Informações de um `@membro`.',
    },
    usage: 'userinfo [@member]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        if (!args[0].match(/\d+/gm)) {
            return await message.channel.send(i18n('mod.userinfo.misingUser', sc?.lang));
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift()).groups.User;
        const guildMember = message.guild.member(userID);

        if (!guildMember) {
            return await message.channel.send(i18n('mod.userinfo.invalidUser', sc?.lang));
        }

        return await message.channel.send(new MessageEmbed({
            title: guildMember.nickname ?? guildMember.user.tag,
            author: {name: message.author.username, iconURL: message.author.avatarURL()},
            color: guildMember.displayHexColor,
            timestamp: new Date(),
            thumbnail: {url: guildMember.user.avatarURL()},
            fields: [
                {name: i18n('mod.userinfo.username#tag', sc?.lang), value: guildMember.user.tag, inline: true},
                {name: i18n('mod.userinfo.uuid', sc?.lang), value: guildMember.id, inline: true},
                {name: i18n('mod.userinfo.roles', sc?.lang), value: guildMember.roles.cache.map(r => `\`${r.name}\``).join(' '), inline: false},
                {
                    name: i18n('mod.userinfo.joined', sc?.lang),
                    value: new Intl.DateTimeFormat('pt-br', {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }).format(guildMember.joinedAt),
                    inline: true
                },
                {name: i18n('mod.userinfo.bot', sc?.lang), value: guildMember.user.bot ? i18n('mod.userinfo.yes', sc?.lang) : i18n('mod.userinfo.no', sc?.lang), inline: true}
            ],
        }));
    },
});
