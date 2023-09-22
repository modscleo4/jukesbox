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
 * @file Server configuration plugin (lang command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import { options } from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n, { langs } from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Lang extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Shows/changes the bot language.',
                pt_BR: 'Mostra/altera o idioma do bot no servidor.',
            },
            options: [
                {
                    name: 'lang',
                    description: 'Language to set.',
                    type: OptionType.STRING,
                    choices: [
                        {
                            name: 'Portuguese (Brazil)',
                            value: 'pt_BR',
                        },
                        {
                            name: 'English (United States)',
                            value: 'en_US',
                        },
                    ],
                }
            ],

            userPermissions: {
                server: ['ManageGuild'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });

        if (args.length === 0) {
            throw new CommandExecutionError({ content: i18n('server.lang.lang', sc?.lang, { lang: sc.lang }) });
        }

        await this.checkPermissions({ guild, channel, author, member });

        if (!(args[0] in langs)) {
            throw new CommandExecutionError({ content: i18n('server.lang.unknownLang', sc?.lang) });
        }

        sc.lang = args[0];
        serverConfig.set(guild.id, sc);
        await sc.save(options.database_url);

        return { content: i18n('server.lang.success', sc?.lang, { lang: args[0] }) };
    }
}

export default new Lang();
