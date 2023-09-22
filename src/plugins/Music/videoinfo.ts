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

import MessageEmbed from "../../lib/MessageEmbed.js";

import { options } from "../../config.js";
import { cutUntil, isValidHttpURL, parseMS, videoInfo } from "../../lib/utils.js";
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class VideoInfo extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Shows YouTube video information.',
                pt_BR: 'Mostra informações de um vídeo do YouTube',
            },
            options: [
                {
                    name: 'url',
                    description: 'YouTube video URL.',
                    type: OptionType.STRING,
                    required: true,
                }
            ],

            botPermissions: {
                text: ['EmbedLinks'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({ guild, channel, author, member });

        if (!isValidHttpURL(args[0]) || !args[0].match(/(\/watch\?v=|youtu.be\/)/gmu)) {
            throw new CommandExecutionError({ content: i18n('music.videoinfo.invalidURL', sc?.lang) });
        }

        const { VideoId } = /(\/watch\?v=|youtu.be\/)(?<VideoId>[^?&#]+)/gmu.exec(args[0])!.groups!;
        const songInfo = (await videoInfo(VideoId, {
            keys: options.ytapikeys,
            part: ['id', 'snippet', 'contentDetails', 'statistics'],
        }).catch(e => {
            console.error(e);
            return [null];
        }))[0];

        if (!songInfo) {
            throw new CommandExecutionError({ content: i18n('music.videoinfo.error', sc?.lang) });
        }

        return {
            embeds: [new MessageEmbed({
                title: i18n('music.videoinfo.embedTitle', sc?.lang),
                url: songInfo.url,
                author: { name: author.username, iconURL: author.avatarURL()! },
                timestamp: new Date(),
                thumbnail: { url: songInfo.snippet!.thumbnails!.high!.url! },
                description: songInfo.snippet!.title!,
                fields: [
                    { name: i18n('music.videoinfo.channel', sc?.lang), value: songInfo.snippet!.channelTitle!, inline: true },
                    { name: i18n('music.videoinfo.duration', sc?.lang), value: parseMS(songInfo.duration * 1000).toString(), inline: true },
                    { name: i18n('music.videoinfo.description', sc?.lang), value: cutUntil(songInfo.snippet!.description!, 1024) || '(Sem descrição)' },
                    { name: i18n('music.videoinfo.views', sc?.lang), value: songInfo.statistics!.viewCount!, inline: true },
                    { name: i18n('music.videoinfo.likes', sc?.lang), value: songInfo.statistics!.likeCount!, inline: true },
                ],
            })]
        };
    }
}

export default new VideoInfo();
