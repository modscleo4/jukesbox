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
 * @file Music plugin (search command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import MessageEmbed from "../../lib/MessageEmbed.js";

import { options } from "../../config.js";
import { searchVideo } from "../../lib/utils.js";
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import play from "./play.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Search extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Searches for a music/playlist. Use `/playlist` to search for playlists.',
                pt_BR: 'Procura por uma música/playlist. Use `/playlist` para procurar por playlists.',
            },
            options: [
                {
                    name: 'mode',
                    description: 'Query Search Mode',
                    type: OptionType.STRING,
                    choices: [
                        {
                            name: 'Video Search Mode',
                            value: '/video',
                        },
                        {
                            name: 'Playlist Search Mode',
                            value: '/playlist',
                        },
                    ],
                    required: true,
                },
                {
                    name: 'q',
                    description: 'Query String',
                    type: OptionType.STRING,
                    required: true,
                }
            ],

            botPermissions: {
                text: ['EmbedLinks'],
                voice: ['Connect', 'Speak'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        await this.checkVoiceChannel({ guild, member });

        await this.checkPermissions({ guild, channel, author, member });


        let kind: 'video' | 'playlist' = 'video';
        switch (args[0]) {
            case '/playlist':
                args.shift();
                kind = 'playlist';
                break;

            case '/video':
                args.shift();
                kind = 'video';
                break;
        }

        if (!args[0]) {
            throw new CommandExecutionError({ content: i18n('music.search.noArgs', sc?.lang) });
        }

        const results = await searchVideo(args.join(' '), {
            keys: options.ytapikeys,
            regionCode: 'us',
            type: [kind],
            videoEmbeddable: kind === 'video' ? 'true' : 'any',
        });

        if (results.length === 0) {
            throw new CommandExecutionError({ content: i18n('music.search.nothingFound', sc?.lang) });
        }

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, results.length);

        const msg = new MessageEmbed({
            title: i18n('music.search.embedTitle', sc?.lang),
            author: { name: author.username, iconURL: author.avatarURL()! },
            timestamp: new Date(),
            description: results.map((r, i) => `**${i + 1}** - [${r.snippet!.title}](${r.url}) | ${r.snippet!.channelTitle}`).join('\n\n'),
        });

        return {
            embeds: [msg],
            reactions,
            timer: 1,
            lockAuthor: true,
            onReact: async ({ reaction, stop }) => {
                stop();
                sendMessage(await play.fn({ client, guild, channel, author, member, sendMessage }, [results[reactions.indexOf(reaction.emoji.name!)].url]));
            },
            deleteOnEnd: true,
        };
    }
}

export default new Search();
