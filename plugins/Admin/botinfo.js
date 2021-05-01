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
 * @file Admin plugin (botinfo command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {startupTime, queue, serverConfig} from "../../global.js";
import * as config from "../../config.js";
import {pageEmbed, parseMS} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Bot information.',
        pt_BR: 'Informações do bot.',
    },
    options: [
        {
            name: 'subcommand',
            description: 'Show all Servers/Voice Channels this bot is in.',
            type: OptionType.STRING,
            choices: [
                {
                    name: 'Servers',
                    value: 'servers',
                },
                {
                    name: 'Voice Channels',
                    value: 'voicechannels',
                },
            ]
        },
    ],

    only: [config.adminID],

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member}, args) {
        const sc = serverConfig.get(guild.id);

        const subcommands = {
            async servers() {
                const servers = client.guilds.cache.map(g => ({
                    name: g.name,
                    value: i18n('admin.botinfo.serverID', sc?.lang, {id: g.id}),
                }));

                return await pageEmbed({client, author}, {title: i18n('admin.botinfo.servers', sc?.lang), content: servers});
            },

            async voicechannels() {
                const voiceChannels = client.voice.connections.map(g => ({
                    name: g.channel.name,
                    value: i18n('admin.botinfo.serverName', sc?.lang, {server: g.channel.guild.name}),
                }));

                return await pageEmbed({client, author}, {title: i18n('admin.botinfo.voiceChannels', sc?.lang), content: voiceChannels});
            },

            async env() {
                const envVars = Object.keys(config).filter(k => typeof config[k] !== 'function').map(k => ({
                    name: k,
                    value: JSON.stringify(config[k], null, 2),
                }));

                return await pageEmbed({client, author}, {title: i18n('admin.botinfo.envVars', sc?.lang), content: envVars});
            },
        };

        await this.checkPermissions({guild, channel, author, member});

        if (args[0] && args[0] in subcommands) {
            return await subcommands[args[0]]();
        }

        return new MessageEmbed({
            title: i18n('admin.botinfo.embedTitle', sc?.lang),
            author: {name: client.user.username, iconURL: client.user.avatarURL()},
            timestamp: new Date(),
            fields: [
                {name: i18n('admin.botinfo.servers', sc?.lang), value: client.guilds.cache.size, inline: true},
                {name: i18n('admin.botinfo.voiceChannels', sc?.lang), value: client.voice.connections.size, inline: true},
                {name: i18n('admin.botinfo.uptime', sc?.lang), value: parseMS(Date.now() - startupTime).toString(), inline: true},
                {name: i18n('admin.botinfo.uuid', sc?.lang), value: client.user.id, inline: false},
                {name: i18n('admin.botinfo.server', sc?.lang), value: guild.region, inline: true},
                {name: i18n('admin.botinfo.ping', sc?.lang), value: `${client.ws.ping.toFixed(0)} ms`, inline: true},
                {name: i18n('admin.botinfo.playingIn', sc?.lang), value: i18n('admin.botinfo.nServers', sc?.lang, {n: queue.size}), inline: true},
                {name: i18n('admin.botinfo.ram', sc?.lang), value: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)} MiB`, inline: true},
                {name: i18n('admin.botinfo.platform', sc?.lang), value: process.platform, inline: true},
            ],
        });
    }
});
