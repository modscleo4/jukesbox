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
 * @file Server configuration plugin (telemetry command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import { options } from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

class Telemetry extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Set the Telemetry level (0- Minimal, 1- Full).',
                pt_BR: 'Configura o nível de telemetria (0- Mínima, 1- Completa).',
            },
            options: [
                {
                    name: 'n',
                    description: 'Number of messages to delete.',
                    type: OptionType.INTEGER,
                    choices: [
                        {
                            name: 'Basic',
                            value: 0,
                        },
                        {
                            name: 'Full',
                            value: 1,
                        },
                    ]
                }
            ],

            userPermissions: {
                server: ['ManageGuild'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });

        await this.checkPermissions({ guild, channel, author, member });

        if (args.length === 0) {
            return {
                content: i18n('server.telemetry.telemetryLevel', sc?.lang, {
                    minimal: i18n('minimal', sc?.lang),
                    full: i18n('full', sc?.lang),
                    telemetryLevel: sc.telemetryLevel,
                })
            };
        }

        const telemetryLevel = Math.min((args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0, 1);

        sc.telemetryLevel = telemetryLevel;
        await sc.save(options.database_url);
        serverConfig.delete(guild.id);

        return { content: i18n('server.telemetry.success', sc?.lang) };
    }
}

export default new Telemetry();
