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
 * @file Help plugin
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

const {MessageEmbed} = require('discord.js');
const {serverConfig} = require('../global');
const {prefix} = require('../config.js');
const {pageEmbed} = require('../lib/utils');

module.exports = {
    help: {
        description: 'Mostra os comandos.',
        usage: 'help [comando1] [comando2]...',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<void>}
         */
        fn: async (message, args) => {
            const sc = serverConfig.get(message.guild.id);
            const serverPrefix = sc ? sc.prefix : prefix;

            const description = `
O prefixo deste servidor é \`${serverPrefix}\`.

Digite \`${serverPrefix}help {comando1} {comando2}\` para obter ajuda de um ou mais comandos em específico.`;

            const commands = message.client.commands;

            if (args.length > 0) {
                for (let i = 0; i < args.length; i++) {
                    if (!(args[i] in commands)) {
                        return await message.channel.send(`Comando \`${args[i]}\` não encontrado.`);
                    }
                }

                for (let i = 0; i < args.length; i++) {
                    const desc = `
O prefixo deste servidor é \`${serverPrefix}\`

\`${serverPrefix}${args[i]}\`
${commands[args[i]].description}

Uso: ${commands[args[i]].usage}

${commands[args[i]].alias ? `Alias: ${commands[args[i]].alias.map(a => `\`${a}\``).join(', ')}` : ''}`;

                    await message.channel.send(new MessageEmbed()
                        .setTitle('Ajuda')
                        .setDescription(desc)
                        .setAuthor(message.client.user.username, message.client.user.avatarURL())
                        .setTimestamp());
                }

                return;
            }

            const cmds = [];
            for (const c in commands) {
                if (commands[c].only && !commands[c].only.includes(message.author.id)) {
                    continue;
                }

                cmds[cmds.length] = {
                    name: `${serverPrefix}${c}`,
                    value: commands[c].description + (commands[c].alias ? `\n\nAlias: ${commands[c].alias.map(a => `\`${a}\``).join(', ')}` : '')
                };
            }

            return await pageEmbed(message, {title: 'Eu entendo isso aqui vei', description}, cmds);
        }
    }
}
