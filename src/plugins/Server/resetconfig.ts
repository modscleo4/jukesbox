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
 * @file Server configuration plugin (resetconfig command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Command, { CommandContext, CommandReturn } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import { options } from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

class ResetConfig extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Reset all Server configuration settings.',
                pt_BR: 'Reseta todas as configurações do Servidor.',
            },

            userPermissions: {
                server: ['ManageGuild'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });

        await this.checkPermissions({ guild, channel, author, member });

        await sc.delete(options.database_url);
        serverConfig.delete(guild.id);

        return { content: i18n('server.resetconfig.success', sc?.lang) };
    }
}

export default new ResetConfig();
