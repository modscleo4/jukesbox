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
 * @file Music plugin (playlist command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Command, { CommandContext, CommandReturn, OptionType } from '../../lib/Command.js';
import play from './play.js';

class PlayList extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Adds a playlist in the queue.',
                pt_BR: 'Adiciona uma playlist na fila.',
            },
            options: [
                {
                    name: 'youtube_url',
                    description: 'YouTube URL or Query String',
                    type: OptionType.STRING,
                    required: true,
                }
            ],

            aliases: ['pl'],

            botPermissions: {
                text: ['EmbedLinks'],
                voice: ['Connect', 'Speak'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        args[-1] = 'playlist';
        return await play.fn({ client, guild, channel, author, member, sendMessage }, args);
    }
}

export default new PlayList();
