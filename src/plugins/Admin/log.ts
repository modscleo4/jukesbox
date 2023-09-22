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
 * @file Admin plugin (log command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { options } from "../../config.js";
import { serverConfig } from "../../global.js";
import { statSync, readdirSync } from 'fs';
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Log extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Sends the current log file.',
                pt_BR: 'Envia o arquivo de log atual.',
            },

            only: [options.adminID],
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        const logs = readdirSync('./logs/');
        if (logs.length === 0 || logs.at(-1) === '.gitkeep' || !statSync('./logs/' + logs.at(-1)).isFile()) {
            throw new CommandExecutionError({ content: i18n('admin.log.noLogs', sc?.lang) });
        }

        return { files: ['./logs/' + logs.at(-1)] };
    }
}

export default new Log();
