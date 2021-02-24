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

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Set the Telemetry level (0- Minimal, 1- Full).',
        pt_BR: 'Configura o nível de telemetria (0- Mínima, 1- Completa).',
    },
    usage: 'telemetry [level]',

    userPermissions: {
        server: ['MANAGE_GUILD'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {String[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix});

        await this.checkPermissions(message);

        if (args.length === 0) {
            return await message.channel.send(i18n('server.telemetry.telemetryLevel', sc?.lang, {
                minimal: i18n('minimal', sc?.lang),
                full: i18n('full', sc?.lang),
                telemetryLevel: sc.telemetryLevel,
            }));
        }

        const telemetryLevel = Math.min((args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0, 1);

        sc.telemetryLevel = telemetryLevel;
        await sc.save(database_url);
        serverConfig.delete(message.guild.id);

        return await message.channel.send(i18n('server.telemetry.success', sc?.lang));
    },
});
