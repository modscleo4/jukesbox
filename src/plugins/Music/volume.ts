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
 * @file Music plugin (volume command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { queue, serverConfig } from "../../global.js";
import { options } from "../../config.js";
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Volume extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Shows/changes the volume (0-100).',
                pt_BR: 'Mostra/altera o volume (0-100).',
            },
            options: [
                {
                    name: 'n',
                    description: 'Volume.',
                    type: OptionType.INTEGER,
                }
            ],

            userPermissions: {
                server: ['ManageGuild'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const serverQueue = queue.get(guild.id);
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });

        if (args.length === 0) {
            throw new CommandExecutionError({ content: i18n('music.volume.volume', sc?.lang, { volume: sc.volume }) });
        }

        await this.checkPermissions({ guild, channel, author, member });

        const volume = Math.min((args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0, 100);

        if (serverQueue) {
            serverQueue.volume = volume;
            serverQueue.resource?.volume?.setVolume(volume / 100);
        }

        sc.volume = volume;
        serverConfig.set(guild.id, sc);
        await sc.save(options.database_url);

        return { content: i18n('music.volume.success', sc?.lang) };
    }
}

export default new Volume();
