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
* @file Server configuration plugin (serverinfo command)
*
* @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
*/

'use strict';

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";
import {MessageEmbed} from "discord.js";

export default new Command({
    description: {
        en_US: 'Shows all Server settings and info.',
        pt_BR: 'Mostra as configurações e informações do Servidor.',
    },
    usage: 'serverinfo',

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {String[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix});

        const subcommands = {
            async roles() {
                return await message.channel.send(new MessageEmbed({
                    title: i18n('server.serverinfo.roles_embedTitle', sc?.lang, {serverName: message.guild.name}),
                    author: {name: message.author.username, iconURL: message.author.avatarURL()},
                    timestamp: new Date(),
                    thumbnail: {url: message.guild.iconURL()},
                    description: message.guild.roles.cache.map(r => `\`${r.name}\``).join(' '),
                }));
            },

            async emojis() {
                return await message.channel.send(new MessageEmbed({
                    title: i18n('server.serverinfo.emojis_embedTitle', sc?.lang, {serverName: message.guild.name}),
                    author: {name: message.author.username, iconURL: message.author.avatarURL()},
                    timestamp: new Date(),
                    thumbnail: {url: message.guild.iconURL()},
                    description: message.guild.emojis.cache.map(e => e.toString()).join(' '),
                }));
            },
        };

        await this.checkPermissions(message);

        if (args[0] && args[0] in subcommands) {
            return await subcommands[args[0]]();
        }

        return await message.channel.send(new MessageEmbed({
            title: message.guild.name,
            author: {name: message.author.username, iconURL: message.author.avatarURL()},
            timestamp: new Date(),
            thumbnail: {url: message.guild.iconURL()},
            fields: [
                {name: i18n('server.serverinfo.owner', sc?.lang), value: `<@!${message.guild.owner.id}>`, inline: true},
                {name: i18n('server.serverinfo.id', sc?.lang), value: message.guild.id, inline: true},
                {name: i18n('server.serverinfo.region', sc?.lang), value: message.guild.region, inline: true},
                {name: i18n('server.serverinfo.members', sc?.lang), value: message.guild.memberCount, inline: true},
                {name: i18n('server.serverinfo.onlineMembers', sc?.lang), value: message.guild.members.cache.filter(m => m.user.presence.status === 'online').size, inline: true},
                {name: '\u200B', value: '\u200B', inline: false},
                {name: i18n('server.serverinfo.textChannels', sc?.lang), value: message.guild.channels.cache.filter(k => k.type === 'text').size, inline: true},
                {name: i18n('server.serverinfo.voiceChannels', sc?.lang), value: message.guild.channels.cache.filter(k => k.type === 'voice').size, inline: true},
                {name: i18n('server.serverinfo.afkChannel', sc?.lang), value: message.guild.afkChannel?.name ?? i18n('server.serverinfo.noAfkChannel', sc?.lang), inline: true},
                {name: i18n('server.serverinfo.roles', sc?.lang), value: message.guild.roles.cache.size, inline: true},
                {name: i18n('server.serverinfo.emojis', sc?.lang), value: message.guild.emojis.cache.size, inline: true},
                {
                    name: i18n('server.serverinfo.createdAt', sc?.lang),
                    value: new Intl.DateTimeFormat('pt-br', {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }).format(message.guild.createdAt),
                    inline: true
                },
                // {name: , value: message.client.guilds.cache.size, inline: true},
                // {name: i18n('server.serverinfo.voiceChannels', sc?.lang), value: message.client.voice.connections.size, inline: true},
                // {name: i18n('server.serverinfo.uptime', sc?.lang), value: parseMS(Date.now() - startupTime).toString(), inline: true},
                // {name: i18n('server.serverinfo.uuid', sc?.lang), value: message.client.user.id, inline: false},
                // {name: i18n('server.serverinfo.server', sc?.lang), value: message.guild.region, inline: true},
                // {name: i18n('server.serverinfo.ping', sc?.lang), value: `${message.client.ws.ping.toFixed(0)} ms`, inline: true},
                // {name: i18n('server.serverinfo.playingIn', sc?.lang), value: i18n('admin.botinfo.nServers', sc?.lang, {n: queue.size}), inline: true},
                // {name: i18n('server.serverinfo.ram', sc?.lang), value: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)} MiB`, inline: true},
                // {name: i18n('server.serverinfo.platform', sc?.lang), value: process.platform, inline: true},
            ],
        }));
    },
});
