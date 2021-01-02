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
 * @file Music plugin (videoinfo command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {ytapikey} from "../../config.js";
import {cutUntil, isValidHttpURL, parseMS, videoInfo} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows YouTube video information.',
        pt_BR: 'Mostra informações de um vídeo do YouTube',
    },
    usage: 'videoinfo [youtube_url]',

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        await this.checkPermissions(message);

        if (!isValidHttpURL(args[0]) || !args[0].match(/(\/watch\?v=|youtu.be\/)/gmu)) {
            return await message.channel.send(i18n('music.videoinfo.invalidURL', sc?.lang));
        }

        const {VideoId} = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^?&#]+)/gmu.exec(args[0]).groups;
        const songInfo = (await videoInfo(VideoId, {
            key: ytapikey,
            part: ['id', 'snippet', 'contentDetails', 'statistics'],
        }).catch(e => {
            console.error(e);
            return [null];
        }))[0];

        if (!songInfo) {
            return await message.channel.send(i18n('music.videoinfo.error', sc?.lang));
        }

        return await message.channel.send(new MessageEmbed({
            title: i18n('music.videoinfo.embedTitle', sc?.lang),
            url: songInfo.url,
            author: {name: message.author.username, iconURL: message.author.avatarURL()},
            timestamp: new Date(),
            thumbnail: {url: songInfo.snippet.thumbnails.high.url},
            description: songInfo.snippet.title,
            fields: [
                {name: i18n('music.videoinfo.channel', sc?.lang), value: songInfo.snippet.channelTitle, inline: true},
                {name: i18n('music.videoinfo.duration', sc?.lang), value: parseMS(songInfo.duration * 1000), inline: true},
                {name: i18n('music.videoinfo.description', sc?.lang), value: cutUntil(songInfo.snippet.description, 1024) || '(Sem descrição)'},
                {name: i18n('music.videoinfo.views', sc?.lang), value: songInfo.statistics.viewCount, inline: true},
                {name: i18n('music.videoinfo.likes', sc?.lang), value: songInfo.statistics.likeCount, inline: true},
                {name: i18n('music.videoinfo.dislikes', sc?.lang), value: songInfo.statistics.dislikeCount, inline: true},
            ],
        }));
    },
});
